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
