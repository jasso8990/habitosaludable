const getCrypto = () => {
  const webCrypto = globalThis.crypto;
  if (!webCrypto?.subtle || !webCrypto?.getRandomValues) {
    throw new Error('WebCrypto no está disponible en este dispositivo');
  }
  return webCrypto;
};

const bytesToBase64 = (bytes) => {
  if (globalThis.Buffer) return globalThis.Buffer.from(bytes).toString('base64');
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  if (!globalThis.btoa) throw new Error('No se encontró codificador base64');
  return globalThis.btoa(binary);
};

const base64ToBytes = (base64) => {
  if (globalThis.Buffer) return new Uint8Array(globalThis.Buffer.from(base64, 'base64'));
  if (!globalThis.atob) throw new Error('No se encontró decodificador base64');
  const binary = globalThis.atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
};

const textToBytes = (text) => new TextEncoder().encode(text);
const bytesToText = (bytes) => new TextDecoder().decode(bytes);

const HYBRID_PREFIX = '__HYBRID__';


const encryptHybrid = async (publicKeyBase64, plainText) => {
  const crypto = getCrypto();
  const publicKey = await importPublicKey(publicKeyBase64);

  const aesKey = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const encryptedPayload = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    textToBytes(plainText)
  );

  const rawAes = await crypto.subtle.exportKey('raw', aesKey);
  const wrappedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, publicKey, new Uint8Array(rawAes));

  const envelope = {
    v: 2,
    alg: 'RSA-OAEP-2048-SHA256+AES-GCM-256',
    key: bytesToBase64(new Uint8Array(wrappedKey)),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(encryptedPayload)),
  };

  const json = JSON.stringify(envelope);
  const body = globalThis.Buffer
    ? globalThis.Buffer.from(json, 'utf8').toString('base64')
    : globalThis.btoa(unescape(encodeURIComponent(json)));

  return `${HYBRID_PREFIX}${body}`;
};

const decryptHybrid = async (privateKeyBase64, hybridValue) => {
  const crypto = getCrypto();
  const privateKey = await importPrivateKey(privateKeyBase64);

  const body = hybridValue.slice(HYBRID_PREFIX.length);
  const json = globalThis.Buffer
    ? globalThis.Buffer.from(body, 'base64').toString('utf8')
    : decodeURIComponent(escape(globalThis.atob(body)));
  const envelope = JSON.parse(json);

  const wrappedKey = base64ToBytes(envelope.key);
  const rawAes = await crypto.subtle.decrypt({ name: 'RSA-OAEP' }, privateKey, wrappedKey);
  const aesKey = await crypto.subtle.importKey('raw', rawAes, { name: 'AES-GCM' }, false, ['decrypt']);

  const iv = base64ToBytes(envelope.iv);
  const data = base64ToBytes(envelope.data);
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, aesKey, data);

  return bytesToText(new Uint8Array(plain));
};

export const generateUserKeyPair = async () => {
  const crypto = getCrypto();
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const [publicKeySpki, privateKeyPkcs8] = await Promise.all([
    crypto.subtle.exportKey('spki', keyPair.publicKey),
    crypto.subtle.exportKey('pkcs8', keyPair.privateKey),
  ]);

  return {
    publicKey: bytesToBase64(new Uint8Array(publicKeySpki)),
    privateKey: bytesToBase64(new Uint8Array(privateKeyPkcs8)),
  };
};

export const importPublicKey = async (base64) => {
  const crypto = getCrypto();
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey(
    'spki',
    bytes.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['encrypt']
  );
};

export const importPrivateKey = async (base64) => {
  const crypto = getCrypto();
  const bytes = base64ToBytes(base64);
  return crypto.subtle.importKey(
    'pkcs8',
    bytes.buffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    true,
    ['decrypt']
  );
};

export const encryptTextWithPublicKey = async (publicKeyBase64, plainText) => {
  const messageBytes = textToBytes(plainText);

  // RSA-OAEP(2048/SHA-256) only supports short payloads (~190 bytes).
  if (messageBytes.length <= 190) {
    const crypto = getCrypto();
    const publicKey = await importPublicKey(publicKeyBase64);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'RSA-OAEP' },
      publicKey,
      messageBytes
    );

    return bytesToBase64(new Uint8Array(encrypted));
  }

  return encryptHybrid(publicKeyBase64, plainText);
};

export const decryptTextWithPrivateKey = async (privateKeyBase64, cipherTextBase64) => {
  if (String(cipherTextBase64 || '').startsWith(HYBRID_PREFIX)) {
    return decryptHybrid(privateKeyBase64, cipherTextBase64);
  }

  const crypto = getCrypto();
  const privateKey = await importPrivateKey(privateKeyBase64);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    base64ToBytes(cipherTextBase64)
  );

  return bytesToText(new Uint8Array(decrypted));
};
