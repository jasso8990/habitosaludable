<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Hábitos Saludables - Panel Administrador</title>
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', system-ui, sans-serif; background: #F5F8FC; color: #1A2B42; }
    
    .header {
      background: linear-gradient(135deg, #1E5F9E, #4A90D9);
      color: white; padding: 20px 32px;
      display: flex; align-items: center; justify-content: space-between;
      box-shadow: 0 4px 20px rgba(30,95,158,0.2);
    }
    .header-left { display: flex; align-items: center; gap: 12px; }
    .logo { font-size: 32px; }
    .app-name { font-size: 20px; font-weight: bold; }
    .app-sub { font-size: 12px; opacity: 0.8; }
    .admin-badge { background: rgba(255,255,255,0.2); padding: 6px 14px; border-radius: 20px; font-size: 13px; }
    
    .login-container {
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }
    .login-box {
      background: white; border-radius: 24px; padding: 40px;
      box-shadow: 0 8px 40px rgba(0,0,0,0.1); width: 400px;
    }
    .login-title { font-size: 24px; font-weight: bold; margin-bottom: 8px; color: #1E5F9E; }
    .login-sub { color: #5A7A9A; margin-bottom: 28px; }
    
    input, select { 
      width: 100%; padding: 12px 16px; border: 2px solid #D1E0EE; 
      border-radius: 10px; font-size: 15px; margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    input:focus, select:focus { outline: none; border-color: #1E5F9E; }
    
    .btn {
      width: 100%; padding: 14px; background: #1E5F9E; color: white;
      border: none; border-radius: 12px; font-size: 16px; font-weight: bold;
      cursor: pointer; transition: background 0.2s;
    }
    .btn:hover { background: #154680; }
    .btn-danger { background: #E74C3C; }
    .btn-danger:hover { background: #C0392B; }
    .btn-sm { width: auto; padding: 8px 16px; font-size: 13px; border-radius: 8px; }
    
    .dashboard { display: none; }
    .sidebar {
      position: fixed; left: 0; top: 0; bottom: 0; width: 240px;
      background: white; box-shadow: 2px 0 20px rgba(0,0,0,0.08);
      padding-top: 80px; z-index: 10;
    }
    .sidebar-item {
      padding: 14px 24px; cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; gap: 12px; font-size: 15px; color: #5A7A9A;
      border-left: 3px solid transparent;
    }
    .sidebar-item:hover, .sidebar-item.active {
      background: #E8F1FA; color: #1E5F9E; border-left-color: #1E5F9E;
    }
    .sidebar-icon { font-size: 18px; }
    
    .main-content { margin-left: 240px; padding: 24px; padding-top: 100px; }
    
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card {
      background: white; border-radius: 16px; padding: 20px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06); text-align: center;
    }
    .stat-icon { font-size: 32px; margin-bottom: 8px; }
    .stat-value { font-size: 28px; font-weight: bold; color: #1E5F9E; }
    .stat-label { font-size: 13px; color: #5A7A9A; margin-top: 4px; }
    
    .card { background: white; border-radius: 16px; padding: 24px; box-shadow: 0 2px 12px rgba(0,0,0,0.06); margin-bottom: 20px; }
    .card-title { font-size: 18px; font-weight: bold; margin-bottom: 16px; display: flex; align-items: center; gap: 8px; }
    
    table { width: 100%; border-collapse: collapse; }
    th { text-align: left; padding: 12px 16px; background: #F5F8FC; color: #5A7A9A; font-size: 13px; font-weight: 600; }
    td { padding: 12px 16px; border-bottom: 1px solid #E8F0F8; font-size: 14px; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #F5F8FC; }
    
    .badge { display: inline-block; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .badge-male { background: #EBF5FF; color: #1E5F9E; }
    .badge-female { background: #FFF0F9; color: #C44480; }
    .badge-premium { background: #FFF9E6; color: #D4AC0D; }
    .badge-free { background: #F0F0F0; color: #888; }
    .badge-blocked { background: #FFE8E6; color: #E74C3C; }
    .badge-active { background: #DCFCE7; color: #16A34A; }
    
    .tab-bar { display: flex; gap: 4px; border-bottom: 2px solid #E8F0F8; margin-bottom: 20px; }
    .tab { padding: 10px 20px; cursor: pointer; font-size: 14px; color: #5A7A9A; border-bottom: 3px solid transparent; margin-bottom: -2px; }
    .tab.active { color: #1E5F9E; border-bottom-color: #1E5F9E; font-weight: 600; }
    
    .section { display: none; }
    .section.active { display: block; }
    
    .search-bar { display: flex; gap: 12px; margin-bottom: 16px; }
    .search-bar input { margin: 0; flex: 1; }
    
    .chart-container { height: 250px; }
    
    #notification { 
      position: fixed; top: 20px; right: 20px; padding: 14px 20px;
      border-radius: 10px; color: white; font-weight: 600; z-index: 1000;
      display: none; max-width: 300px;
    }
  </style>
</head>
<body>

<!-- Notificación -->
<div id="notification"></div>

<!-- HEADER -->
<div class="header" style="position: fixed; top: 0; left: 0; right: 0; z-index: 100;">
  <div class="header-left">
    <span class="logo">🌱</span>
    <div>
      <div class="app-name">Hábitos Saludables</div>
      <div class="app-sub">Panel de Administración</div>
    </div>
  </div>
  <div class="admin-badge">🔐 Administrador</div>
</div>

<!-- LOGIN -->
<div class="login-container" id="loginSection">
  <div class="login-box">
    <div style="text-align:center; margin-bottom: 20px;">
      <span style="font-size: 48px;">🌱</span>
    </div>
    <div class="login-title">Acceso Administrativo</div>
    <div class="login-sub">Solo el administrador autorizado puede acceder</div>
    <input type="email" id="adminEmail" placeholder="Correo del administrador" />
    <input type="password" id="adminPassword" placeholder="Contraseña" />
    <button class="btn" onclick="adminLogin()">Iniciar Sesión</button>
  </div>
</div>

<!-- DASHBOARD -->
<div class="dashboard" id="dashboardSection">
  <div class="sidebar">
    <div class="sidebar-item active" onclick="showSection('overview')">
      <span class="sidebar-icon">📊</span> Resumen
    </div>
    <div class="sidebar-item" onclick="showSection('users')">
      <span class="sidebar-icon">👥</span> Usuarios
    </div>
    <div class="sidebar-item" onclick="showSection('stats')">
      <span class="sidebar-icon">📈</span> Estadísticas
    </div>
    <div class="sidebar-item" onclick="showSection('blocked')">
      <span class="sidebar-icon">🚫</span> Bloqueados
    </div>
    <div class="sidebar-item" style="margin-top: auto;" onclick="adminLogout()">
      <span class="sidebar-icon">🚪</span> Cerrar Sesión
    </div>
  </div>

  <div class="main-content">
    <!-- RESUMEN -->
    <div class="section active" id="overviewSection">
      <h2 style="margin-bottom: 20px; font-size: 24px;">📊 Resumen General</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">👥</div>
          <div class="stat-value" id="totalUsers">-</div>
          <div class="stat-label">Usuarios Registrados</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⭐</div>
          <div class="stat-value" id="premiumUsers">-</div>
          <div class="stat-label">Usuarios Premium</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🌱</div>
          <div class="stat-value" id="totalHabits">-</div>
          <div class="stat-label">Hábitos Creados</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value" id="totalCompletions">-</div>
          <div class="stat-label">Hábitos Completados</div>
        </div>
      </div>

      <div class="card">
        <div class="card-title">📈 Distribución por Edad</div>
        <div class="chart-container">
          <canvas id="ageChart"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-title">👫 Distribución por Sexo</div>
        <div class="chart-container" style="height: 200px;">
          <canvas id="genderChart"></canvas>
        </div>
      </div>
    </div>

    <!-- USUARIOS -->
    <div class="section" id="usersSection">
      <h2 style="margin-bottom: 20px; font-size: 24px;">👥 Gestión de Usuarios</h2>
      <div class="card">
        <div class="search-bar">
          <input type="text" id="searchUsers" placeholder="🔍 Buscar por nombre o correo..." oninput="filterUsers()" />
          <select id="filterGender" onchange="filterUsers()">
            <option value="">Todos los géneros</option>
            <option value="male">Hombres</option>
            <option value="female">Mujeres</option>
          </select>
        </div>
        <table id="usersTable">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Teléfono</th>
              <th>Edad</th>
              <th>Sexo</th>
              <th>Plan</th>
              <th>Estado</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody id="usersTableBody">
            <tr><td colspan="8" style="text-align:center; color:#999;">Cargando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- ESTADÍSTICAS -->
    <div class="section" id="statsSection">
      <h2 style="margin-bottom: 20px; font-size: 24px;">📈 Estadísticas Detalladas</h2>
      <div class="card">
        <div class="card-title">📅 Registro por Mes</div>
        <div class="chart-container">
          <canvas id="monthlyChart"></canvas>
        </div>
      </div>
    </div>

    <!-- BLOQUEADOS -->
    <div class="section" id="blockedSection">
      <h2 style="margin-bottom: 20px; font-size: 24px;">🚫 Usuarios Bloqueados</h2>
      <div class="card">
        <table>
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Motivo</th><th>Acción</th></tr>
          </thead>
          <tbody id="blockedTableBody">
            <tr><td colspan="4" style="text-align:center; color:#999;">Cargando...</td></tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</div>

<script>
  // =====================
  // CONFIGURACIÓN
  // Reemplaza con tus datos de Supabase
  // =====================
  const SUPABASE_URL = 'TU_SUPABASE_URL';
  const SUPABASE_ANON_KEY = 'TU_SUPABASE_ANON_KEY';
  const ADMIN_EMAIL = 'TU_CORREO_ADMIN@gmail.com';

  const { createClient } = supabase;
  const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  let allUsers = [];

  function notify(msg, color = '#2ECC71') {
    const n = document.getElementById('notification');
    n.textContent = msg;
    n.style.background = color;
    n.style.display = 'block';
    setTimeout(() => n.style.display = 'none', 3000);
  }

  async function adminLogin() {
    const email = document.getElementById('adminEmail').value;
    const password = document.getElementById('adminPassword').value;

    if (email !== ADMIN_EMAIL) {
      notify('❌ Acceso no autorizado', '#E74C3C');
      return;
    }

    const { error } = await db.auth.signInWithPassword({ email, password });
    if (error) { notify('❌ ' + error.message, '#E74C3C'); return; }

    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('dashboardSection').style.display = 'block';
    loadDashboardData();
  }

  async function adminLogout() {
    await db.auth.signOut();
    document.getElementById('loginSection').style.display = 'flex';
    document.getElementById('dashboardSection').style.display = 'none';
  }

  async function loadDashboardData() {
    const { data: users } = await db.from('user_profiles').select('*').order('created_at', { ascending: false });
    const { count: habitsCount } = await db.from('habits').select('*', { count: 'exact', head: true });
    const { count: completionsCount } = await db.from('habit_completions').select('*', { count: 'exact', head: true });

    allUsers = users || [];
    const premiumCount = allUsers.filter(u => u.is_premium).length;

    document.getElementById('totalUsers').textContent = allUsers.length;
    document.getElementById('premiumUsers').textContent = premiumCount;
    document.getElementById('totalHabits').textContent = habitsCount || 0;
    document.getElementById('totalCompletions').textContent = completionsCount || 0;

    renderUsersTable(allUsers);
    renderAgeChart(allUsers);
    renderGenderChart(allUsers);
    renderBlockedTable(allUsers.filter(u => u.is_blocked));
  }

  function calcAge(birthDate) {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    if (today.getMonth() < birth.getMonth() || (today.getMonth() === birth.getMonth() && today.getDate() < birth.getDate())) age--;
    return age;
  }

  function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!users.length) {
      tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:#999;">No hay usuarios registrados</td></tr>';
      return;
    }
    tbody.innerHTML = users.map(u => `
      <tr>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td>${u.phone}</td>
        <td>${calcAge(u.birth_date)} años</td>
        <td><span class="badge ${u.gender === 'male' ? 'badge-male' : 'badge-female'}">${u.gender === 'male' ? '👨 Hombre' : '👩 Mujer'}</span></td>
        <td><span class="badge ${u.is_premium ? 'badge-premium' : 'badge-free'}">${u.is_premium ? '⭐ Premium' : '🆓 Gratis'}</span></td>
        <td><span class="badge ${u.is_blocked ? 'badge-blocked' : 'badge-active'}">${u.is_blocked ? '🚫 Bloqueado' : '✅ Activo'}</span></td>
        <td>
          ${u.is_blocked
            ? `<button class="btn btn-sm" onclick="unblockUser('${u.id}')">Desbloquear</button>`
            : `<button class="btn btn-sm btn-danger" onclick="blockUser('${u.id}', '${u.full_name}')">Bloquear</button>`
          }
        </td>
      </tr>
    `).join('');
  }

  function filterUsers() {
    const query = document.getElementById('searchUsers').value.toLowerCase();
    const gender = document.getElementById('filterGender').value;
    const filtered = allUsers.filter(u => {
      const matchText = u.full_name?.toLowerCase().includes(query) || u.email?.toLowerCase().includes(query);
      const matchGender = !gender || u.gender === gender;
      return matchText && matchGender;
    });
    renderUsersTable(filtered);
  }

  async function blockUser(userId, userName) {
    const reason = prompt(`¿Por qué bloqueas a ${userName}?`);
    if (!reason) return;

    await db.from('user_profiles').update({ is_blocked: true, block_reason: reason }).eq('id', userId);
    notify(`✅ ${userName} bloqueado`);
    loadDashboardData();
  }

  async function unblockUser(userId) {
    await db.from('user_profiles').update({ is_blocked: false, block_reason: null }).eq('id', userId);
    notify('✅ Usuario desbloqueado');
    loadDashboardData();
  }

  function renderBlockedTable(blocked) {
    const tbody = document.getElementById('blockedTableBody');
    if (!blocked.length) {
      tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:#999;">No hay usuarios bloqueados</td></tr>';
      return;
    }
    tbody.innerHTML = blocked.map(u => `
      <tr>
        <td><strong>${u.full_name}</strong></td>
        <td>${u.email}</td>
        <td>${u.block_reason || 'Sin motivo'}</td>
        <td><button class="btn btn-sm" onclick="unblockUser('${u.id}')">Desbloquear</button></td>
      </tr>
    `).join('');
  }

  function renderAgeChart(users) {
    const ranges = { '6-12': 0, '13-17': 0, '18-24': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    users.forEach(u => {
      const age = calcAge(u.birth_date);
      if (age <= 12) ranges['6-12']++;
      else if (age <= 17) ranges['13-17']++;
      else if (age <= 24) ranges['18-24']++;
      else if (age <= 34) ranges['25-34']++;
      else if (age <= 44) ranges['35-44']++;
      else if (age <= 54) ranges['45-54']++;
      else ranges['55+']++;
    });

    new Chart(document.getElementById('ageChart'), {
      type: 'bar',
      data: {
        labels: Object.keys(ranges),
        datasets: [{ label: 'Usuarios', data: Object.values(ranges), backgroundColor: '#4A90D9', borderRadius: 8 }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }
    });
  }

  function renderGenderChart(users) {
    const male = users.filter(u => u.gender === 'male').length;
    const female = users.filter(u => u.gender === 'female').length;

    new Chart(document.getElementById('genderChart'), {
      type: 'doughnut',
      data: {
        labels: ['Hombres', 'Mujeres'],
        datasets: [{ data: [male, female], backgroundColor: ['#1E5F9E', '#C44480'] }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function showSection(name) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.sidebar-item').forEach(s => s.classList.remove('active'));
    document.getElementById(name + 'Section').classList.add('active');
    event.currentTarget.classList.add('active');
  }
</script>
</body>
</html>
