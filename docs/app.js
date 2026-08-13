(() => {
  "use strict";

  const STORAGE_KEY = "miham-tasks-v1";
  const FILTERS = new Set(["all", "active", "completed"]);
  const number = new Intl.NumberFormat("ar-QA");
  const time = new Intl.DateTimeFormat("ar-QA", { hour: "numeric", minute: "2-digit" });
  const date = new Intl.DateTimeFormat("ar-QA", { weekday: "long", day: "numeric", month: "long" });

  const elements = {
    form: document.querySelector("#add-form"),
    input: document.querySelector("#task-title"),
    addButton: document.querySelector("#add-button"),
    list: document.querySelector("#task-list"),
    summary: document.querySelector("#task-summary"),
    today: document.querySelector("#today"),
    progressRing: document.querySelector("#progress-ring"),
    progressValue: document.querySelector("#progress-value"),
    progressMessage: document.querySelector("#progress-message"),
    filterButtons: [...document.querySelectorAll("[data-filter]")],
  };

  let tasks = loadTasks();
  let filter = "all";

  elements.today.textContent = date.format(new Date());
  elements.input.addEventListener("input", () => {
    elements.addButton.disabled = !elements.input.value.trim();
  });

  elements.form.addEventListener("submit", (event) => {
    event.preventDefault();
    const title = elements.input.value.trim();
    if (!title) return;

    tasks.unshift({
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
    });
    elements.input.value = "";
    elements.addButton.disabled = true;
    filter = "all";
    saveAndRender();
    elements.input.focus();
  });

  elements.filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const nextFilter = button.dataset.filter;
      if (!FILTERS.has(nextFilter)) return;
      filter = nextFilter;
      render();
    });
  });

  function loadTasks() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
      if (!Array.isArray(value)) return [];
      return value.filter(isTask).slice(0, 500);
    } catch {
      return [];
    }
  }

  function isTask(value) {
    return value && typeof value.id === "string" && typeof value.title === "string" &&
      typeof value.completed === "boolean" && typeof value.createdAt === "string";
  }

  function saveAndRender() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    } catch {
      // The interface remains usable even when private browsing blocks storage.
    }
    render();
  }

  function toggleTask(id) {
    tasks = tasks.map((task) => task.id === id ? { ...task, completed: !task.completed } : task);
    saveAndRender();
  }

  function deleteTask(id) {
    tasks = tasks.filter((task) => task.id !== id);
    saveAndRender();
  }

  function visibleTasks() {
    if (filter === "active") return tasks.filter((task) => !task.completed);
    if (filter === "completed") return tasks.filter((task) => task.completed);
    return tasks;
  }

  function render() {
    const completed = tasks.filter((task) => task.completed).length;
    const remaining = tasks.length - completed;
    const progress = tasks.length ? Math.round((completed / tasks.length) * 100) : 0;

    elements.progressRing.style.setProperty("--progress", `${progress}%`);
    elements.progressValue.textContent = `${number.format(progress)}٪`;
    elements.progressMessage.textContent = remaining
      ? `${number.format(remaining)} متبقية`
      : tasks.length ? "اكتمل اليوم" : "ابدأ بخطوة";
    elements.summary.replaceChildren(
      strong(number.format(tasks.length)),
      document.createTextNode(" مهام · "),
      strong(number.format(completed)),
      document.createTextNode(" مكتملة"),
    );

    elements.filterButtons.forEach((button) => {
      const active = button.dataset.filter === filter;
      button.classList.toggle("active", active);
      button.setAttribute("aria-pressed", String(active));
    });

    const visible = visibleTasks();
    elements.list.replaceChildren();
    if (!visible.length) {
      elements.list.append(emptyState());
      return;
    }
    visible.forEach((task) => elements.list.append(taskElement(task)));
  }

  function strong(text) {
    const node = document.createElement("strong");
    node.textContent = text;
    return node;
  }

  function taskElement(task) {
    const article = document.createElement("article");
    article.className = `task-item${task.completed ? " completed" : ""}`;

    const check = document.createElement("button");
    check.type = "button";
    check.className = "task-check";
    check.setAttribute("aria-label", `${task.completed ? "إعادة فتح" : "إكمال"} ${task.title}`);
    check.innerHTML = '<span aria-hidden="true">✓</span>';
    check.addEventListener("click", () => toggleTask(task.id));

    const content = document.createElement("div");
    content.className = "task-content";
    const heading = document.createElement("h2");
    heading.textContent = task.title;
    const meta = document.createElement("p");
    const createdAt = new Date(task.createdAt);
    meta.textContent = `${task.completed ? "أُنجزت" : "أُضيفت"} · ${Number.isNaN(createdAt.getTime()) ? "الآن" : time.format(createdAt)}`;
    content.append(heading, meta);

    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "delete-button";
    remove.setAttribute("aria-label", `حذف ${task.title}`);
    remove.innerHTML = '<span aria-hidden="true">×</span>';
    remove.addEventListener("click", () => deleteTask(task.id));

    article.append(check, content, remove);
    return article;
  }

  function emptyState() {
    const content = {
      all: ["القائمة جاهزة لأول مهمة", "ابدأ بشيء صغير، فالخطوة الأولى تصنع الفرق."],
      active: ["لا شيء متبقٍ الآن", "يمكنك العودة إلى كل المهام من التصفية أعلاه."],
      completed: ["لا توجد مهام مكتملة بعد", "يمكنك العودة إلى كل المهام من التصفية أعلاه."],
    }[filter];
    const wrapper = document.createElement("div");
    wrapper.className = "empty-state";
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = "✓";
    const heading = document.createElement("h2");
    heading.textContent = content[0];
    const copy = document.createElement("p");
    copy.textContent = content[1];
    wrapper.append(icon, heading, copy);
    return wrapper;
  }

  render();
})();
