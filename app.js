// ===== SOP 管理系统 - 应用逻辑 =====

// 数据存储
const STORAGE_KEY = 'sop_manager_data';
const THEME_KEY = 'sop_manager_theme';

let sops = [];
let editingSopId = null;
let deletingSopId = null;
let selectedColor = 'blue';
let tempSections = [];

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  loadData();
  loadTheme();
  renderBoard();
  bindEvents();
});

// ===== 数据加载/保存 =====
function loadData() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      sops = JSON.parse(stored);
    } catch(e) {
      sops = [];
    }
  } else {
    // 初始示例数据
    sops = getDefaultSops();
    saveData();
  }
}

function saveData() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(sops));
}

function getDefaultSops() {
  return [
    {
      id: generateId(),
      title: '每日工作流程',
      desc: '标准化的日常工作安排',
      color: 'blue',
      sections: [
        {
          id: generateId(),
          title: '上午',
          tasks: [
            { id: generateId(), text: '查看邮件和消息', done: true },
            { id: generateId(), text: '参加晨会', done: true },
            { id: generateId(), text: '处理紧急任务', done: false }
          ]
        },
        {
          id: generateId(),
          title: '下午',
          tasks: [
            { id: generateId(), text: '专注核心项目开发', done: false },
            { id: generateId(), text: '回复客户咨询', done: false },
            { id: generateId(), text: '整理当日工作总结', done: false }
          ]
        }
      ]
    },
    {
      id: generateId(),
      title: '项目发布流程',
      desc: '新项目上线的标准操作流程',
      color: 'green',
      sections: [
        {
          id: generateId(),
          title: '发布前检查',
          tasks: [
            { id: generateId(), text: '完成代码审查', done: false },
            { id: generateId(), text: '通过全部测试', done: false },
            { id: generateId(), text: '更新版本号', done: false }
          ]
        },
        {
          id: generateId(),
          title: '发布操作',
          tasks: [
            { id: generateId(), text: '备份当前版本', done: false },
            { id: generateId(), text: '部署到生产环境', done: false },
            { id: generateId(), text: '验证线上服务', done: false }
          ]
        }
      ]
    },
    {
      id: generateId(),
      title: '入职引导流程',
      desc: '新员工入职操作清单',
      color: 'purple',
      sections: [
        {
          id: generateId(),
          title: '账号开通',
          tasks: [
            { id: generateId(), text: '创建邮箱账号', done: false },
            { id: generateId(), text: '开通系统权限', done: false },
            { id: generateId(), text: '分配工位设备', done: false }
          ]
        },
        {
          id: generateId(),
          title: '培训安排',
          tasks: [
            { id: generateId(), text: '公司文化介绍', done: false },
            { id: generateId(), text: '岗位技能培训', done: false }
          ]
        }
      ]
    }
  ];
}

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// ===== 主题管理 =====
function loadTheme() {
  const theme = localStorage.getItem(THEME_KEY) || 'light';
  document.body.setAttribute('data-theme', theme);
  updateThemeIcon(theme);
}

function toggleTheme() {
  const current = document.body.getAttribute('data-theme');
  const next = current === 'dark' ? 'light' : 'dark';
  document.body.setAttribute('data-theme', next);
  localStorage.setItem(THEME_KEY, next);
  updateThemeIcon(next);
}

function updateThemeIcon(theme) {
  const btn = document.getElementById('themeToggle');
  btn.textContent = theme === 'dark' ? '☀️' : '🌙';
}

// ===== 渲染面板 =====
function renderBoard(filter = '') {
  const board = document.getElementById('board');
  const emptyState = document.getElementById('emptyState');

  // 过滤
  let filteredSops = sops;
  if (filter) {
    const f = filter.toLowerCase();
    filteredSops = sops.filter(sop =>
      sop.title.toLowerCase().includes(f) ||
      sop.desc.toLowerCase().includes(f) ||
      sop.sections.some(sec =>
        sec.title.toLowerCase().includes(f) ||
        sec.tasks.some(t => t.text.toLowerCase().includes(f))
      )
    );
  }

  // 空状态
  if (filteredSops.length === 0) {
    board.style.display = 'none';
    if (filter) {
      emptyState.querySelector('h2').textContent = '未找到匹配的 SOP';
      emptyState.querySelector('p').textContent = `没有包含"${filter}"的内容`;
    } else {
      emptyState.querySelector('h2').textContent = '还没有 SOP';
      emptyState.querySelector('p').textContent = '点击右上角"新建 SOP"开始创建你的标准操作流程';
    }
    emptyState.classList.add('show');
  } else {
    board.style.display = 'flex';
    emptyState.classList.remove('show');
    board.innerHTML = filteredSops.map(sop => renderCard(sop)).join('');
  }

  updateStats();
}

// ===== 渲染单个卡片 =====
function renderCard(sop) {
  const totalTasks = sop.sections.reduce((sum, s) => sum + s.tasks.length, 0);
  const doneTasks = sop.sections.reduce((sum, s) => sum + s.tasks.filter(t => t.done).length, 0);
  const rate = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  const sectionsHtml = sop.sections.map(section => `
    <div class="section-title">${escapeHtml(section.title)}</div>
    ${section.tasks.map(task => `
      <div class="task-item ${task.done ? 'completed' : ''}" onclick="toggleTask('${sop.id}', '${section.id}', '${task.id}')">
        <div class="task-checkbox ${task.done ? 'checked' : ''}"></div>
        <div class="task-text">${escapeHtml(task.text)}</div>
      </div>
    `).join('')}
  `).join('');

  return `
    <div class="sop-card" data-color="${sop.color}">
      <div class="card-stripe"></div>
      <div class="card-header">
        <div class="card-header-top">
          <div class="card-title">${escapeHtml(sop.title)}</div>
          <div class="card-actions">
            <button class="card-action-btn" onclick="editSop('${sop.id}')" title="编辑">✏️</button>
            <button class="card-action-btn delete" onclick="confirmDelete('${sop.id}')" title="删除">🗑️</button>
          </div>
        </div>
        ${sop.desc ? `<div class="card-desc">${escapeHtml(sop.desc)}</div>` : ''}
        <div class="card-progress-info">
          <div class="progress-bar"><div class="progress-fill" style="width:${rate}%"></div></div>
          <span class="progress-text">${doneTasks}/${totalTasks}</span>
        </div>
      </div>
      <div class="card-body">
        ${sectionsHtml || '<p style="color:var(--text-muted);font-size:13px;padding:8px 0;">暂无任务</p>'}
      </div>
    </div>
  `;
}

// ===== HTML 转义 =====
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ===== 更新统计 =====
function updateStats() {
  const totalSops = sops.length;
  let totalTasks = 0, doneTasks = 0;
  sops.forEach(sop => {
    sop.sections.forEach(sec => {
      totalTasks += sec.tasks.length;
      doneTasks += sec.tasks.filter(t => t.done).length;
    });
  });

  document.getElementById('totalSops').textContent = totalSops;
  document.getElementById('totalTasks').textContent = totalTasks;
  document.getElementById('completedTasks').textContent = doneTasks;
  document.getElementById('completionRate').textContent = totalTasks > 0
    ? Math.round((doneTasks / totalTasks) * 100) + '%'
    : '0%';
}

// ===== 任务打勾 =====
window.toggleTask = function(sopId, sectionId, taskId) {
  const sop = sops.find(s => s.id === sopId);
  if (!sop) return;
  const section = sop.sections.find(s => s.id === sectionId);
  if (!section) return;
  const task = section.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.done = !task.done;
  saveData();
  renderBoard(document.getElementById('searchInput').value);
};

// ===== 编辑/新建 SOP =====
window.editSop = function(sopId) {
  const sop = sops.find(s => s.id === sopId);
  if (!sop) return;

  editingSopId = sopId;
  document.getElementById('modalTitle').textContent = '编辑 SOP';
  document.getElementById('sopTitle').value = sop.title;
  document.getElementById('sopDesc').value = sop.desc || '';
  selectedColor = sop.color;
  tempSections = JSON.parse(JSON.stringify(sop.sections));

  updateColorSelection();
  renderSectionsEditor();
  showModal();
};

// ===== 确认删除 =====
window.confirmDelete = function(sopId) {
  deletingSopId = sopId;
  document.getElementById('confirmOverlay').classList.add('show');
};

// ===== 模态框 =====
function showModal() {
  document.getElementById('modalOverlay').classList.add('show');
}

function hideModal() {
  document.getElementById('modalOverlay').classList.remove('show');
  editingSopId = null;
  tempSections = [];
  selectedColor = 'blue';
  document.getElementById('sopTitle').value = '';
  document.getElementById('sopDesc').value = '';
  updateColorSelection();
  renderSectionsEditor();
}

// ===== 颜色选择 =====
function updateColorSelection() {
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.classList.toggle('selected', opt.dataset.color === selectedColor);
  });
}

// ===== 小标题编辑器 =====
function renderSectionsEditor() {
  const container = document.getElementById('sectionsEditor');
  if (tempSections.length === 0) {
    container.innerHTML = '<p style="color:var(--text-muted);font-size:13px;">点击下方按钮添加小标题</p>';
    return;
  }

  container.innerHTML = tempSections.map((section, si) => `
    <div class="section-edit-block">
      <input type="text" class="section-title-input" value="${escapeHtml(section.title)}"
        placeholder="小标题名称"
        oninput="updateSectionTitle(${si}, this.value)" />
      <div class="task-edit-list" id="taskList_${si}">
        ${section.tasks.map((task, ti) => `
          <div class="task-edit-row">
            <input type="text" value="${escapeHtml(task.text)}"
              placeholder="任务内容"
              oninput="updateTaskText(${si}, ${ti}, this.value)" />
            <button onclick="removeTask(${si}, ${ti})" title="删除任务">✕</button>
          </div>
        `).join('')}
      </div>
      <button class="btn-add-task" onclick="addTask(${si})">+ 添加任务</button>
      <button class="btn-remove-section" onclick="removeSection(${si})">删除此小标题</button>
    </div>
  `).join('');
}

window.updateSectionTitle = function(si, val) {
  tempSections[si].title = val;
};

window.updateTaskText = function(si, ti, val) {
  tempSections[si].tasks[ti].text = val;
};

window.addTask = function(si) {
  tempSections[si].tasks.push({ id: generateId(), text: '', done: false });
  renderSectionsEditor();
  // 聚焦到新添加的输入框
  setTimeout(() => {
    const list = document.getElementById(`taskList_${si}`);
    if (list) {
      const inputs = list.querySelectorAll('input');
      if (inputs.length > 0) inputs[inputs.length - 1].focus();
    }
  }, 50);
};

window.removeTask = function(si, ti) {
  tempSections[si].tasks.splice(ti, 1);
  renderSectionsEditor();
};

window.removeSection = function(si) {
  tempSections.splice(si, 1);
  renderSectionsEditor();
};

function addSection() {
  tempSections.push({
    id: generateId(),
    title: '',
    tasks: []
  });
  renderSectionsEditor();
  // 聚焦到新标题输入框
  setTimeout(() => {
    const blocks = document.querySelectorAll('.section-edit-block');
    if (blocks.length > 0) {
      const last = blocks[blocks.length - 1];
      const input = last.querySelector('.section-title-input');
      if (input) input.focus();
    }
  }, 50);
}

// ===== 保存 SOP =====
function saveSop() {
  const title = document.getElementById('sopTitle').value.trim();
  const desc = document.getElementById('sopDesc').value.trim();

  if (!title) {
    alert('请输入大标题');
    return;
  }

  // 清理空任务
  const cleanSections = tempSections
    .filter(s => s.title.trim() || s.tasks.some(t => t.text.trim()))
    .map(s => ({
      ...s,
      title: s.title.trim() || '未命名',
      tasks: s.tasks.filter(t => t.text.trim()).map(t => ({ ...t, text: t.text.trim() }))
    }));

  if (editingSopId) {
    // 编辑
    const sop = sops.find(s => s.id === editingSopId);
    if (sop) {
      sop.title = title;
      sop.desc = desc;
      sop.color = selectedColor;
      sop.sections = cleanSections;
    }
  } else {
    // 新建
    sops.push({
      id: generateId(),
      title,
      desc,
      color: selectedColor,
      sections: cleanSections
    });
  }

  saveData();
  hideModal();
  renderBoard(document.getElementById('searchInput').value);
}

// ===== 事件绑定 =====
function bindEvents() {
  // 新建按钮
  document.getElementById('addSopBtn').addEventListener('click', () => {
    editingSopId = null;
    document.getElementById('modalTitle').textContent = '新建 SOP';
    document.getElementById('sopTitle').value = '';
    document.getElementById('sopDesc').value = '';
    selectedColor = 'blue';
    tempSections = [];
    updateColorSelection();
    renderSectionsEditor();
    showModal();
    setTimeout(() => document.getElementById('sopTitle').focus(), 100);
  });

  // 添加小标题
  document.getElementById('addSectionBtn').addEventListener('click', addSection);

  // 保存
  document.getElementById('saveBtn').addEventListener('click', saveSop);

  // 取消
  document.getElementById('cancelBtn').addEventListener('click', hideModal);
  document.getElementById('closeModal').addEventListener('click', hideModal);

  // 点击遮罩关闭
  document.getElementById('modalOverlay').addEventListener('click', (e) => {
    if (e.target.id === 'modalOverlay') hideModal();
  });

  // 颜色选择
  document.querySelectorAll('.color-option').forEach(opt => {
    opt.addEventListener('click', () => {
      selectedColor = opt.dataset.color;
      updateColorSelection();
    });
  });

  // 主题切换
  document.getElementById('themeToggle').addEventListener('click', toggleTheme);

  // 搜索
  document.getElementById('searchInput').addEventListener('input', (e) => {
    renderBoard(e.target.value);
  });

  // 确认删除
  document.getElementById('confirmDelete').addEventListener('click', () => {
    if (deletingSopId) {
      sops = sops.filter(s => s.id !== deletingSopId);
      saveData();
      renderBoard(document.getElementById('searchInput').value);
    }
    document.getElementById('confirmOverlay').classList.remove('show');
    deletingSopId = null;
  });

  document.getElementById('confirmCancel').addEventListener('click', () => {
    document.getElementById('confirmOverlay').classList.remove('show');
    deletingSopId = null;
  });

  // ESC 关闭
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      hideModal();
      document.getElementById('confirmOverlay').classList.remove('show');
    }
    // Ctrl/Cmd + Enter 保存
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      if (document.getElementById('modalOverlay').classList.contains('show')) {
        saveSop();
      }
    }
  });
}
