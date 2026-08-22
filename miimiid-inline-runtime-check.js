


    /* =========================================
       MIIMIID DYNAMIC APP DASHBOARD
       ========================================= */

    let miimiidDashboardData = null;
    let miimiidActiveView = "home";

    const MIIMIID_DASHBOARD_NAV = [
      {
        id: "home",
        key: "home"
      },
      {
        id: "learn",
        key: "learn"
      },
      {
        id: "funCenter",
        key: "funCenter"
      },
      {
        id: "aiTutor",
        key: "aiTutor"
      }
    ];

    /*
     * MIIMIID SECONDARY DRAWER REGISTRY
     *
     * Only genuinely implemented secondary/account
     * destinations may be registered here.
     *
     * Do not add planned, placeholder, or fabricated
     * destinations. The primary navigation remains
     * Home / Learn / Fun Center / AI Tutor.
     */
    const MIIMIID_DRAWER_ITEMS = [];

    window.MIIMIID_DRAWER_ITEMS = MIIMIID_DRAWER_ITEMS;

    const MIIMIID_DASHBOARD_STATS = [
      {
        id: "xp",
        value: data => data.totalXP,
        key: "xp"
      },
      {
        id: "streak",
        value: data => data.streak,
        key: "streak"
      },
      {
        id: "lessons",
        value: data => data.totalLessonsCompleted,
        key: "lessonsCompleted"
      },
      {
        id: "score",
        value: data => `${data.averageQuizScore}%`,
        key: "averageQuizScore"
      }
    ];

    function miimiidDashboardTranslate(key) {
      return typeof miimiidTranslate === "function"
        ? miimiidTranslate(key, getSavedLanguage())
        : key;
    }

    function renderMiimiidBottomNavigation() {
      const nav =
        document.getElementById("miimiid-bottom-nav");

      if (!nav) {
        return;
      }

      nav.innerHTML =
        MIIMIID_DASHBOARD_NAV
          .map(item => `
            <button
              type="button"
              data-dashboard-view="${item.id}"
              class="${miimiidActiveView === item.id ? "active" : ""}"
              aria-current="${miimiidActiveView === item.id ? "page" : "false"}"
            >
              ${miimiidDashboardTranslate(item.key)}
            </button>
          `)
          .join("");

      nav.querySelectorAll("[data-dashboard-view]")
        .forEach(button => {
          button.addEventListener("click", () => {
            miimiidNavigate(button.dataset.dashboardView);
          });
        });

    }

    function renderMiimiidDashboard() {
      const dashboard =
        document.getElementById("miimiid-dashboard");

      if (!dashboard || !miimiidDashboardData) {
        return;
      }

      const data = miimiidDashboardData;

      dashboard.innerHTML = `
        <div class="miimiid-dashboard-header">
          <h1 class="miimiid-dashboard-brand">
            ${miimiidDashboardTranslate("home")}
          </h1>

          <div class="miimiid-auth-user">
            <span class="miimiid-auth-user-name">
              ${escapeHtml(
                miimiidCurrentUser &&
                miimiidCurrentUser.name
                  ? miimiidCurrentUser.name
                  : ""
              )}
            </span>

            <button
              type="button"
              class="btn btn-sm miimiid-logout-btn"
              id="miimiid-logout-btn"
            >
              Sign Out
            </button>
          </div>

        </div>

        <div class="miimiid-dashboard-content">
          <div class="miimiid-dashboard-stat-grid">
            ${MIIMIID_DASHBOARD_STATS.map(stat => `
              <button
                type="button"
                class="miimiid-dashboard-stat"
                data-dashboard-stat="${stat.id}"
                aria-label="${miimiidDashboardTranslate(stat.key)}"
              >
                <span class="miimiid-dashboard-stat-value">
                  ${stat.value(data)}
                </span>
                <span class="miimiid-dashboard-stat-label">
                  ${miimiidDashboardTranslate(stat.key)}
                </span>
              </button>
            `).join("")}
          </div>
        </div>
      `;

      renderMiimiidDashboardMenu();
      bindMiimiidDashboardMenu();
      bindMiimiidDashboardStats();

      const logoutButton =
        document.getElementById(
          "miimiid-logout-btn"
        );

      if (
        logoutButton &&
        logoutButton.dataset.bound !== "true"
      ) {
        logoutButton.dataset.bound = "true";

        logoutButton.addEventListener(
          "click",
          logoutMiimiid
        );
      }
    }

    function renderMiimiidDashboardMenu() {
      const panel =
        document.getElementById(
          "miimiid-dashboard-menu-panel"
        );

      if (!panel) {
        return;
      }

      const menuItems =
        Array.isArray(window.MIIMIID_DRAWER_ITEMS)
          ? window.MIIMIID_DRAWER_ITEMS
          : [];

      panel.innerHTML = menuItems
        .filter(item =>
          item &&
          typeof item.key === "string" &&
          typeof item.id === "string"
        )
        .map(item => `
          <button
            type="button"
            class="miimiid-dashboard-menu-item"
            data-menu-key="${item.id}"
          >
            ${miimiidDashboardTranslate(item.key)}
          </button>
        `)
        .join("");
    }

    function bindMiimiidDashboardMenu() {
      const menu =
        document.getElementById(
          "miimiid-dashboard-menu"
        );

      const toggle =
        document.getElementById(
          "miimiid-menu-toggle"
        );

      const backdrop =
        document.getElementById(
          "miimiid-drawer-backdrop"
        );

      if (!menu || !toggle || !backdrop) {
        return;
      }

      /*
       * Dashboard rendering can happen more than once.
       * Bind the persistent drawer controls only once.
       */
      if (toggle.dataset.bound === "true") {
        return;
      }

      toggle.dataset.bound = "true";

      const closeMenu = () => {
        menu.classList.remove("open");

        toggle.setAttribute(
          "aria-expanded",
          "false"
        );

        backdrop.setAttribute(
          "aria-hidden",
          "true"
        );

        document.body.classList.remove(
          "miimiid-drawer-open"
        );
      };

      const openMenu = () => {
        menu.classList.add("open");

        toggle.setAttribute(
          "aria-expanded",
          "true"
        );

        backdrop.setAttribute(
          "aria-hidden",
          "false"
        );

        document.body.classList.add(
          "miimiid-drawer-open"
        );
      };

      toggle.addEventListener(
        "click",
        event => {
          event.stopPropagation();

          if (menu.classList.contains("open")) {
            closeMenu();
          } else {
            openMenu();
          }
        }
      );

      backdrop.addEventListener(
        "click",
        closeMenu
      );

      document.addEventListener(
        "keydown",
        event => {
          if (
            event.key === "Escape" &&
            menu.classList.contains("open")
          ) {
            closeMenu();
          }
        }
      );

      menu.addEventListener(
        "click",
        event => {
          const item =
            event.target.closest(
              ".miimiid-dashboard-menu-item"
            );

          if (!item) {
            return;
          }

          const menuId =
            item.dataset.menuKey;

          const drawerItem =
            window.MIIMIID_DRAWER_ITEMS.find(
              entry => entry.id === menuId
            );

          closeMenu();

          if (
            drawerItem &&
            typeof drawerItem.action === "function"
          ) {
            drawerItem.action();
          }
        }
      );
    }

    async function initializeMiimiidDashboard() {
      /*
       * Dashboard initialization is allowed only after
       * the real authenticated user has been established.
       */
      const userId =
        getMiimiidCurrentUserId();

      if (!userId) {
        showMiimiidAuthView();
        return;
      }

      renderMiimiidBottomNavigation();
      await miimiidNavigate("home");
    }

    async function loadMiimiidDashboard() {
      const dashboard =
        document.getElementById(
          "miimiid-dashboard"
        );

      if (!dashboard) {
        return;
      }

      try {
        const userId =
          getMiimiidCurrentUserId();

        if (!userId) {
          console.warn(
            "Miimiid dashboard: no authenticated user ID is available."
          );

          miimiidDashboardData = null;
          return;
        }

        const response =
          await fetch(
            `/api/learn/dashboard/${encodeURIComponent(userId)}`
          );

        if (!response.ok) {
          throw new Error(
            `Dashboard request failed: ${response.status}`
          );
        }

        const result =
          await response.json();

        if (
          !result ||
          result.status !== "success" ||
          !result.data
        ) {
          throw new Error(
            "Dashboard response was invalid."
          );
        }

        miimiidDashboardData =
          result.data;

        renderMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid dashboard loading error:",
          error
        );

        miimiidDashboardData = {
          totalLessonsCompleted: 0,
          averageQuizScore: 0,
          streak: 0,
          totalXP: 0
        };

        renderMiimiidDashboard();
      }
    }

    function miimiidSetLearningViewVisible(visible) {
      const courseList =
        document.getElementById(
          "course-list-view"
        );

      const courseDetail =
        document.getElementById(
          "course-detail-view"
        );

      const lessonView =
        document.getElementById(
          "lesson-view"
        );

      if (courseList) {
        courseList.classList.toggle(
          "hidden",
          !visible || (
            currentCourseId &&
            courseDetail &&
            !courseDetail.classList.contains("hidden")
          )
        );
      }

      if (!visible) {
        if (courseDetail) {
          courseDetail.classList.add("hidden");
        }

        if (lessonView) {
          lessonView.classList.add("hidden");
        }
      }
    }

    function bindMiimiidDashboardStats() {
      const dashboard =
        document.getElementById("miimiid-dashboard");

      if (!dashboard) {
        return;
      }

      dashboard
        .querySelectorAll("[data-dashboard-stat]")
        .forEach(stat => {
          stat.addEventListener("click", () => {
            miimiidHandleStatClick(
              stat.dataset.dashboardStat
            );
          });
        });
    }

    function miimiidHandleStatClick(stat) {
      if (!miimiidDashboardData) {
        return;
      }

      switch (stat) {
        case "lessonsCompleted":
        case "averageQuizScore":
          miimiidNavigate("learn");
          return;

        case "xp":
        case "streak":
          miimiidNavigate("home");
          return;

        default:
          return;
      }
    }

    /*
     * MIIMIID FUN CENTER
     *
     * The Fun Center is data-driven.
     *
     * Activity definitions are loaded from the backend.
     * This frontend code never owns the activity questions,
     * answers, or activity catalog.
     */

    let miimiidFunCenterActivities = [];
    let miimiidFunCenterState = null;

    async function loadMiimiidFunCenter() {
      try {
        const language =
          typeof getSavedLanguage === "function"
            ? getSavedLanguage()
            : "en";

        const response =
          await fetch(
            `/api/learn/fun-center?language=${encodeURIComponent(language)}`
          );

        if (!response.ok) {
          throw new Error(
            `Fun Center request failed: ${response.status}`
          );
        }

        const result =
          await response.json();

        if (
          !result ||
          result.status !== "success" ||
          !Array.isArray(result.data)
        ) {
          throw new Error(
            "Fun Center response was invalid."
          );
        }

        miimiidFunCenterActivities =
          result.data;

        renderMiimiidFunCenter();

      } catch (error) {
        console.error(
          "Miimiid Fun Center loading error:",
          error
        );

        miimiidFunCenterActivities = [];

        renderMiimiidFunCenter();
      }
    }

    function renderMiimiidFunCenter() {
      const title =
        document.getElementById("fun-center-title");

      const subtitle =
        document.getElementById("fun-center-subtitle");

      const content =
        document.getElementById("fun-center-content");

      if (!title || !subtitle || !content) {
        return;
      }

      title.textContent =
        miimiidDashboardTranslate("funCenter");

      subtitle.textContent =
        miimiidDashboardTranslate("funCenterSubtitle");

      if (
        !Array.isArray(miimiidFunCenterActivities) ||
        miimiidFunCenterActivities.length === 0
      ) {
        content.innerHTML = "";
        return;
      }

      content.innerHTML =
        miimiidFunCenterActivities
          .map(activity => {
            const label =
              miimiidDashboardTranslate(
                activity.titleKey
              );

            return `
              <button
                type="button"
                class="miimiid-fun-center-activity"
                data-fun-center-activity="${activity.id}"
              >
                ${label}
              </button>
            `;
          })
          .join("");

      content
        .querySelectorAll(
          "[data-fun-center-activity]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              renderMiimiidFunActivity(
                button.dataset.funCenterActivity
              );
            }
          );
        });
    }

    function renderMiimiidFunActivity(activityId) {
      const content =
        document.getElementById(
          "fun-center-content"
        );

      if (!content) {
        return;
      }

      const activity =
        miimiidFunCenterActivities.find(
          item =>
            item.id === activityId
        );

      if (
        !activity ||
        !Array.isArray(activity.rounds) ||
        activity.rounds.length === 0
      ) {
        renderMiimiidFunCenter();
        return;
      }

      miimiidFunCenterState = {
        activityId: activity.id,
        roundIndex: 0,
        score: 0,
        answered: false
      };

      renderMiimiidFunActivityRound();
    }

    function renderMiimiidFunActivityRound() {
      const content =
        document.getElementById(
          "fun-center-content"
        );

      if (!content || !miimiidFunCenterState) {
        return;
      }

      const activity =
        miimiidFunCenterActivities.find(
          item =>
            item.id ===
            miimiidFunCenterState.activityId
        );

      if (!activity) {
        renderMiimiidFunCenter();
        return;
      }

      const rounds =
        Array.isArray(activity.rounds)
          ? activity.rounds
          : [];

      if (
        miimiidFunCenterState.roundIndex >=
        rounds.length
      ) {
        renderMiimiidFunActivityResult(
          activity
        );
        return;
      }

      const current =
        rounds[
          miimiidFunCenterState.roundIndex
        ];

      const question =
        miimiidDashboardTranslate(
          current.textKey
        );

      const answers =
        Array.isArray(activity.answers)
          ? activity.answers
          : [];

      content.innerHTML = `
        <div
          class="miimiid-fun-center-round"
          data-fun-round="${current.id}"
        >
          <p>
            ${question}
          </p>

          <div
            class="miimiid-fun-center-actions"
          >
            ${answers
              .map(answer => `
                <button
                  type="button"
                  class="miimiid-fun-center-activity"
                  data-fun-answer="${answer.id}"
                >
                  ${miimiidDashboardTranslate(
                    answer.key
                  )}
                </button>
              `)
              .join("")}
          </div>
        </div>
      `;

      content
        .querySelectorAll(
          "[data-fun-answer]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              handleMiimiidFunAnswer(
                button.dataset.funAnswer
              );
            }
          );
        });
    }

    function handleMiimiidFunAnswer(answer) {
      if (
        !miimiidFunCenterState ||
        miimiidFunCenterState.answered
      ) {
        return;
      }

      const activity =
        miimiidFunCenterActivities.find(
          item =>
            item.id ===
            miimiidFunCenterState.activityId
        );

      if (!activity) {
        return;
      }

      const rounds =
        Array.isArray(activity.rounds)
          ? activity.rounds
          : [];

      const current =
        rounds[
          miimiidFunCenterState.roundIndex
        ];

      if (!current) {
        return;
      }

      miimiidFunCenterState.answered = true;

      if (answer === current.answer) {
        miimiidFunCenterState.score++;
      }

      miimiidFunCenterState.roundIndex++;
      miimiidFunCenterState.answered = false;

      renderMiimiidFunActivityRound();
    }

    function renderMiimiidFunActivityResult(activity) {
      const content =
        document.getElementById(
          "fun-center-content"
        );

      if (!content || !miimiidFunCenterState) {
        return;
      }

      const rounds =
        Array.isArray(activity.rounds)
          ? activity.rounds
          : [];

      const resultTitle =
        miimiidDashboardTranslate(
          activity.resultTitleKey
        );

      const resultMessage =
        miimiidDashboardTranslate(
          activity.resultMessageKey
        );

      const backLabel =
        miimiidDashboardTranslate(
          "funBack"
        );

      content.innerHTML = `
        <div
          class="miimiid-fun-center-result"
        >
          <h2>
            ${resultTitle}
          </h2>

          <p>
            ${resultMessage}
          </p>

          <strong>
            ${miimiidFunCenterState.score}
            /
            ${rounds.length}
          </strong>

          <button
            type="button"
            class="miimiid-fun-center-activity"
            data-fun-center-back
          >
            ${backLabel}
          </button>
        </div>
      `;

      const backButton =
        content.querySelector(
          "[data-fun-center-back]"
        );

      if (backButton) {
        backButton.addEventListener(
          "click",
          () => {
            miimiidFunCenterState = null;
            renderMiimiidFunCenter();
          }
        );
      }
    }

    async function miimiidNavigate(view) {
      miimiidActiveView = view;

      const dashboard =
        document.getElementById(
          "miimiid-dashboard"
        );

      if (view === "home") {
        miimiidSetLearningViewVisible(false);

        const funCenterView =
          document.getElementById(
            "miimiid-fun-center-view"
          );

        if (funCenterView) {
          funCenterView.classList.add("hidden");
        }

        if (dashboard) {
          dashboard.classList.add("active");
        }

        renderMiimiidBottomNavigation();

        await loadMiimiidDashboard();
        return;
      }

      if (dashboard) {
        dashboard.classList.remove("active");
      }

      if (view === "funCenter") {
        miimiidSetLearningViewVisible(false);

        const courseList =
          document.getElementById(
            "course-list-view"
          );

        const courseDetail =
          document.getElementById(
            "course-detail-view"
          );

        const lessonView =
          document.getElementById(
            "lesson-view"
          );

        const aiTutorView =
          document.getElementById(
            "miimiid-ai-tutor-view"
          );

        if (courseList) {
          courseList.classList.add("hidden");
        }

        if (courseDetail) {
          courseDetail.classList.add("hidden");
        }

        if (lessonView) {
          lessonView.classList.add("hidden");
        }

        if (aiTutorView) {
          aiTutorView.classList.add("hidden");
        }

        const funCenterView =
          document.getElementById(
            "miimiid-fun-center-view"
          );

        if (funCenterView) {
          funCenterView.classList.remove("hidden");
        }

        renderMiimiidBottomNavigation();
        await loadMiimiidFunCenter();
        return;
      }

      if (view === "learn") {
        const funCenterView =
          document.getElementById(
            "miimiid-fun-center-view"
          );

        if (funCenterView) {
          funCenterView.classList.add("hidden");
        }

        const courseList =
          document.getElementById(
            "course-list-view"
          );

        const courseDetail =
          document.getElementById(
            "course-detail-view"
          );

        const lessonView =
          document.getElementById(
            "lesson-view"
          );

        const aiTutorView =
          document.getElementById(
            "miimiid-ai-tutor-view"
          );

        if (courseDetail) {
          courseDetail.classList.add("hidden");
        }

        if (lessonView) {
          lessonView.classList.add("hidden");
        }

        if (aiTutorView) {
          aiTutorView.classList.add("hidden");
        }

        if (courseList) {
          courseList.classList.remove("hidden");
        }

        currentCourseId = null;
        currentLessonId = null;

        renderMiimiidBottomNavigation();

        await fetchCourses();
        return;
      }

      if (view === "aiTutor") {
        miimiidSetLearningViewVisible(false);

        const funCenterView =
          document.getElementById(
            "miimiid-fun-center-view"
          );

        if (funCenterView) {
          funCenterView.classList.add("hidden");
        }

        const courseList =
          document.getElementById(
            "course-list-view"
          );

        const courseDetail =
          document.getElementById(
            "course-detail-view"
          );

        const lessonView =
          document.getElementById(
            "lesson-view"
          );

        const aiTutorView =
          document.getElementById(
            "miimiid-ai-tutor-view"
          );

        if (courseList) {
          courseList.classList.add("hidden");
        }

        if (courseDetail) {
          courseDetail.classList.add("hidden");
        }

        if (lessonView) {
          lessonView.classList.add("hidden");
        }

        if (aiTutorView) {
          aiTutorView.classList.remove("hidden");
        }

        renderMiimiidBottomNavigation();
        initializeMiimiidAITutor();

        return;
      }

      renderMiimiidBottomNavigation();
    }

    /* =========================================
       MIIMIID AI TUTOR FRONTEND
       ========================================= */

    let miimiidAITutorHistory = [];
    let miimiidAITutorInitialized = false;

    /*
     * Current learning context for Miimiid AI Tutor.
     *
     * This is intentionally frontend-only for now.
     * It allows the Tutor UI to understand what lesson
     * the learner is studying before the OpenAI API is
     * configured.
     */
    let miimiidAITutorLessonContext = null;

    function setMiimiidAITutorLessonContext(context) {
      if (!context || typeof context !== "object") {
        miimiidAITutorLessonContext = null;
        return;
      }

      miimiidAITutorLessonContext = {
        courseId: context.courseId || null,
        courseTitle: context.courseTitle || "",
        moduleTitle: context.moduleTitle || "",
        moduleNumber:
          Number(context.moduleNumber) || 0,
        lessonId: context.lessonId || null,
        lessonTitle: context.lessonTitle || "",
        lessonDescription:
          context.lessonDescription || "",
        contentBlocks:
          Array.isArray(context.contentBlocks)
            ? context.contentBlocks
            : [],
        language:
          context.language ||
          (
            typeof getSavedLanguage === "function"
              ? getSavedLanguage()
              : "en"
          )
      };

      renderMiimiidAITutorContext();
    }

    function renderMiimiidAITutorStarters() {
      const container =
        document.getElementById(
          "ai-tutor-starters"
        );

      if (!container) {
        return;
      }

      const context =
        miimiidAITutorLessonContext;

      if (!context || !context.lessonTitle) {
        container.innerHTML = "";
        return;
      }

      const starters = [
        {
          key: "aiTutorExplain",
          fallback: "Explain this lesson",
          prompt:
            "Explain this lesson to me in simple, practical terms. Use examples I can relate to."
        },
        {
          key: "aiTutorExample",
          fallback: "Give me a real-life example",
          prompt:
            "Give me a realistic real-life example that shows how this lesson applies to everyday money decisions."
        },
        {
          key: "aiTutorQuiz",
          fallback: "Test me",
          prompt:
            "Test me on this lesson with a short interactive quiz. Ask one question at a time and wait for my answer."
        },
        {
          key: "aiTutorRemember",
          fallback: "What should I remember?",
          prompt:
            "What are the most important practical things I should remember from this lesson?"
        },
        {
          key: "aiTutorHelp",
          fallback: "I don't understand this",
          prompt:
            "Help me understand this lesson more simply. Break down the difficult parts step by step and avoid unnecessary jargon."
        }
      ];

      container.innerHTML =
        starters
          .map(item => `
            <button
              type="button"
              class="miimiid-ai-tutor-starter"
              data-ai-tutor-prompt="${escapeHtml(item.prompt)}"
            >
              ${escapeHtml(
                miimiidAITutorTranslate(
                  item.key,
                  item.fallback
                )
              )}
            </button>
          `)
          .join("");

      container
        .querySelectorAll(
          "[data-ai-tutor-prompt]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              const input =
                document.getElementById(
                  "ai-tutor-input"
                );

              if (!input) {
                return;
              }

              input.value =
                button.dataset.aiTutorPrompt || "";

              input.focus();
            }
          );
        });
    }

    function renderMiimiidAITutorContext() {
      const contextElement =
        document.getElementById(
          "ai-tutor-context"
        );

      if (!contextElement) {
        return;
      }

      const context =
        miimiidAITutorLessonContext;

      if (
        !context ||
        !context.lessonTitle
      ) {
        contextElement.textContent = "";
        contextElement.classList.add("hidden");
        return;
      }

      const moduleText =
        context.moduleTitle
          ? context.moduleTitle
          : (
              context.moduleNumber > 0
                ? `Module ${context.moduleNumber}`
                : ""
            );

      const prefix =
        miimiidAITutorTranslate(
          "aiTutorStudying",
          "Studying"
        );

      contextElement.textContent =
        moduleText
          ? `${prefix}: ${moduleText} → ${context.lessonTitle}`
          : `${prefix}: ${context.lessonTitle}`;

      contextElement.classList.remove("hidden");

      renderMiimiidAITutorStarters();
    }

    function miimiidAITutorTranslate(
      key,
      fallback
    ) {
      if (typeof miimiidTranslate === "function") {
        const translated =
          miimiidTranslate(
            key,
            getSavedLanguage()
          );

        if (
          translated &&
          translated !== key
        ) {
          return translated;
        }
      }

      return fallback;
    }

    function renderMiimiidAITutorWelcome() {
      const messages =
        document.getElementById(
          "ai-tutor-messages"
        );

      if (!messages) {
        return;
      }

      messages.innerHTML = "";

      const welcome =
        document.createElement("div");

      welcome.className =
        "miimiid-ai-tutor-message assistant";

      welcome.textContent =
        miimiidAITutorTranslate(
          "aiTutorWelcome",
          "Hi! I'm Miimiid AI Tutor. Ask me anything about money, saving, spending, investing, or building better financial habits."
        );

      messages.appendChild(welcome);
    }

    function initializeMiimiidAITutor() {
      const input =
        document.getElementById(
          "ai-tutor-input"
        );

      const form =
        document.getElementById(
          "ai-tutor-form"
        );

      const title =
        document.getElementById(
          "ai-tutor-title"
        );

      const subtitle =
        document.getElementById(
          "ai-tutor-subtitle"
        );

      if (!input || !form) {
        return;
      }

      if (title) {
        title.textContent =
          miimiidAITutorTranslate(
            "aiTutor",
            "Miimiid AI Tutor"
          );
      }

      if (subtitle) {
        subtitle.textContent =
          miimiidAITutorTranslate(
            "aiTutorSubtitle",
            "Your personal financial-learning tutor."
          );
      }

      input.placeholder =
        miimiidAITutorTranslate(
          "aiTutorPlaceholder",
          "Ask Miimiid AI Tutor anything about money..."
        );

      if (!miimiidAITutorInitialized) {
        form.addEventListener(
          "submit",
          handleMiimiidAITutorSubmit
        );

        miimiidAITutorInitialized = true;
      }

      renderMiimiidAITutorContext();
      renderMiimiidAITutorStarters();

      if (
        miimiidAITutorHistory.length === 0
      ) {
        renderMiimiidAITutorWelcome();
      }
    }

    function addMiimiidAITutorMessage(
      role,
      content
    ) {
      const messages =
        document.getElementById(
          "ai-tutor-messages"
        );

      if (!messages) {
        return;
      }

      const message =
        document.createElement("div");

      message.className =
        `miimiid-ai-tutor-message ${role}`;

      message.textContent = content;

      messages.appendChild(message);
      messages.scrollTop =
        messages.scrollHeight;
    }

    async function handleMiimiidAITutorSubmit(
      event
    ) {
      event.preventDefault();

      const input =
        document.getElementById(
          "ai-tutor-input"
        );

      const status =
        document.getElementById(
          "ai-tutor-status"
        );

      const sendButton =
        document.getElementById(
          "ai-tutor-send-btn"
        );

      if (!input) {
        return;
      }

      const message =
        input.value.trim();

      if (!message) {
        if (status) {
          status.textContent =
            miimiidAITutorTranslate(
              "aiTutorEmptyMessage",
              "Type a question first."
            );
        }

        input.focus();
        return;
      }

      addMiimiidAITutorMessage(
        "user",
        message
      );

      miimiidAITutorHistory.push({
        role: "user",
        content: message
      });

      input.value = "";

      if (status) {
        status.textContent =
          miimiidAITutorTranslate(
            "aiTutorThinking",
            "Miimiid AI Tutor is thinking..."
          );
      }

      if (sendButton) {
        sendButton.disabled = true;
      }

      try {
        const response =
          await fetch(
            "/api/ai-tutor/chat",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json"
              },
              body: JSON.stringify({
                message,
                history:
                  miimiidAITutorHistory
                    .slice(-12),
                language:
                  getSavedLanguage
                    ? getSavedLanguage()
                    : "en",
                courseTitle:
                  typeof currentCourseTitle !==
                  "undefined"
                    ? currentCourseTitle
                    : "",
                moduleTitle:
                  typeof currentModuleTitle !==
                  "undefined"
                    ? currentModuleTitle
                    : "",
                lessonTitle:
                  typeof currentLessonTitle !==
                  "undefined"
                    ? currentLessonTitle
                    : ""
              })
            }
          );

        let data = null;

        try {
          data = await response.json();
        } catch (_) {
          data = null;
        }

        if (
          !response.ok
        ) {
          if (
            data &&
            data.code ===
              "AI_TUTOR_NOT_CONFIGURED"
          ) {
            addMiimiidAITutorMessage(
              "assistant",
              miimiidAITutorTranslate(
                "aiTutorComingSoon",
                "Miimiid AI Tutor is being prepared. AI conversations will be available soon."
              )
            );

            if (status) {
              status.textContent =
                miimiidAITutorTranslate(
                  "aiTutorComingSoonStatus",
                  "AI Tutor is not connected yet."
                );
            }

            return;
          }

          throw new Error(
            data &&
            data.message
              ? data.message
              : "Unable to reach Miimiid AI Tutor."
          );
        }

        const answer =
          data &&
          typeof data.answer ===
            "string"
            ? data.answer.trim()
            : "";

        if (!answer) {
          throw new Error(
            "The AI Tutor returned an empty response."
          );
        }

        addMiimiidAITutorMessage(
          "assistant",
          answer
        );

        miimiidAITutorHistory.push({
          role: "assistant",
          content: answer
        });

        if (status) {
          status.textContent = "";
        }

      } catch (error) {
        console.error(
          "Miimiid AI Tutor frontend error:",
          error
        );

        addMiimiidAITutorMessage(
          "assistant",
          miimiidAITutorTranslate(
            "aiTutorError",
            "I couldn't connect to Miimiid AI Tutor right now. Please try again later."
          )
        );

        if (status) {
          status.textContent =
            miimiidAITutorTranslate(
              "aiTutorErrorStatus",
              "Connection unavailable."
            );
        }

      } finally {
        if (sendButton) {
          sendButton.disabled = false;
        }

        input.focus();
      }
    }



    /* =========================================
       MIIMIID AUTHENTICATION STATE
       ========================================= */

    let miimiidCurrentUser = null;
    let miimiidAuthInitialized = false;

    function setMiimiidAuthStatus(message, type = "") {
      const status =
        document.getElementById("miimiid-auth-status");

      if (!status) {
        return;
      }

      status.textContent = message || "";
      status.className =
        "miimiid-auth-status" +
        (type ? ` ${type}-text` : "");
    }

    function showMiimiidAuthMode(mode) {
      const login =
        document.getElementById("miimiid-login-form");

      const register =
        document.getElementById("miimiid-register-form");

      const forgot =
        document.getElementById("miimiid-forgot-form");

      const reset =
        document.getElementById("miimiid-reset-form");

      const title =
        document.getElementById("miimiid-auth-title");

      const subtitle =
        document.getElementById("miimiid-auth-subtitle");

      if (!login || !register || !forgot || !reset) {
        return;
      }

      login.classList.toggle(
        "hidden",
        mode !== "login"
      );

      register.classList.toggle(
        "hidden",
        mode !== "register"
      );

      forgot.classList.toggle(
        "hidden",
        mode !== "forgot"
      );

      reset.classList.toggle(
        "hidden",
        mode !== "reset"
      );

      if (title) {
        if (mode === "register") {
          title.textContent =
            miimiidDashboardTranslate("authCreateAccount");
        } else if (mode === "forgot") {
          title.textContent =
            miimiidDashboardTranslate("authResetPassword");
        } else if (mode === "reset") {
          title.textContent =
            miimiidDashboardTranslate("authResetTitle");
        } else {
          title.textContent =
            miimiidDashboardTranslate("authWelcome");
        }
      }

      if (subtitle) {
        if (mode === "register") {
          subtitle.textContent =
            miimiidDashboardTranslate("authCreateSubtitle");
        } else if (mode === "forgot") {
          subtitle.textContent =
            miimiidDashboardTranslate("authResetSubtitle");
        } else if (mode === "reset") {
          subtitle.textContent =
            miimiidDashboardTranslate("authResetDescription");
        } else {
          subtitle.textContent =
            miimiidDashboardTranslate("authSignInSubtitle");
        }
      }

      setMiimiidAuthStatus("");
    }

    function showMiimiidAuthView() {
      const authView =
        document.getElementById("miimiid-auth-view");

      const authLoading =
        document.getElementById("miimiid-auth-loading");

      const authCard =
        document.getElementById("miimiid-auth-card");

      const appShell =
        document.getElementById("miimiid-app-shell");

      const funCenter =
        document.getElementById("miimiid-fun-center-view");

      const aiTutor =
        document.getElementById("miimiid-ai-tutor-view");

      const courseList =
        document.getElementById("course-list-view");

      const courseDetail =
        document.getElementById("course-detail-view");

      const lessonView =
        document.getElementById("lesson-view");

      if (authView) {
        authView.classList.remove("hidden");
      }

      if (authLoading) {
        authLoading.classList.add("hidden");
      }

      if (authCard) {
        authCard.classList.remove("hidden");
      }

      if (appShell) {
        appShell.classList.add("hidden");
      }

      [
        funCenter,
        aiTutor,
        courseList,
        courseDetail,
        lessonView
      ].forEach(element => {
        if (element) {
          element.classList.add("hidden");
        }
      });

      showMiimiidAuthMode("login");
    }

    function hideMiimiidAuthView() {
      const authView =
        document.getElementById("miimiid-auth-view");

      const appShell =
        document.getElementById("miimiid-app-shell");

      if (authView) {
        authView.classList.add("hidden");
      }

      if (appShell) {
        appShell.classList.remove("hidden");
      }
    }

    async function loadMiimiidCurrentUser() {
      try {
        const response =
          await fetch(
            "/api/auth/me",
            {
              method: "GET",
              credentials: "same-origin",
              headers: {
                "Accept": "application/json"
              }
            }
          );

        if (!response.ok) {
          miimiidCurrentUser = null;
          return null;
        }

        const result =
          await response.json();

        if (
          result &&
          result.status === "success" &&
          result.data &&
          result.data.user
        ) {
          miimiidCurrentUser =
            result.data.user;

          window.currentUser =
            miimiidCurrentUser;

          window.MIIMIID_CURRENT_USER =
            miimiidCurrentUser;

          return miimiidCurrentUser;
        }

        miimiidCurrentUser = null;
        return null;

      } catch (error) {
        console.error(
          "Miimiid authentication check failed:",
          error
        );

        miimiidCurrentUser = null;
        return null;
      }
    }

    function getMiimiidCurrentUserId() {
      const candidates = [
        miimiidCurrentUser,
        window.currentUser,
        window.MIIMIID_CURRENT_USER,
        window.loggedInUser,
        window.user
      ];

      for (const user of candidates) {
        if (
          user &&
          typeof user.id === "string" &&
          /^[a-fA-F0-9]{24}$/.test(user.id)
        ) {
          return user.id;
        }

        if (
          user &&
          typeof user._id === "string" &&
          /^[a-fA-F0-9]{24}$/.test(user._id)
        ) {
          return user._id;
        }
      }

      return null;
    }

    async function miimiidAuthenticate(
      endpoint,
      payload
    ) {
      const response =
        await fetch(
          endpoint,
          {
            method: "POST",
            credentials: "same-origin",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(payload)
          }
        );

      let result = null;

      try {
        result = await response.json();
      } catch (error) {
        throw new Error(
          "The authentication server returned an invalid response."
        );
      }

      if (
        !response.ok ||
        !result ||
        result.status !== "success"
      ) {
        throw new Error(
          result &&
          result.message
            ? result.message
            : "Authentication request failed."
        );
      }

      if (
        result.data &&
        result.data.user
      ) {
        miimiidCurrentUser =
          result.data.user;

        window.currentUser =
          miimiidCurrentUser;

        window.MIIMIID_CURRENT_USER =
          miimiidCurrentUser;
      }

      return miimiidCurrentUser;
    }

    async function handleMiimiidLogin(event) {
      event.preventDefault();

      const identifier =
        document
          .getElementById(
            "miimiid-login-identifier"
          )
          ?.value
          .trim();

      const password =
        document
          .getElementById(
            "miimiid-login-password"
          )
          ?.value || "";

      const submit =
        document.getElementById(
          "miimiid-login-submit"
        );

      if (!identifier || !password) {
        setMiimiidAuthStatus(
          "Enter your email or phone number and password.",
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        "Signing in..."
      );

      try {
        await miimiidAuthenticate(
          "/api/auth/login",
          {
            identifier,
            password
          }
        );

        setMiimiidAuthStatus(
          "Signed in successfully.",
          "success"
        );

        hideMiimiidAuthView();

        await initializeMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid login error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          "Unable to sign in.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    let miimiidRegistrationStep = 1;
    let miimiidVerificationEmail = "";
    let miimiidVerificationExpiresAt = 0;
    let miimiidVerificationTimer = null;

    function showMiimiidRegistrationStep(step) {
      const steps =
        document.querySelectorAll(
          "#miimiid-register-form [data-register-step]"
        );

      if (!steps.length) {
        return;
      }

      const requestedStep =
        Math.max(
          1,
          Math.min(
            5,
            Number(step) || 1
          )
        );

      miimiidRegistrationStep =
        requestedStep;

      steps.forEach(section => {
        const sectionStep =
          Number(
            section.getAttribute(
              "data-register-step"
            )
          );

        section.classList.toggle(
          "hidden",
          sectionStep !== requestedStep
        );
      });

      const feedback =
        document.getElementById(
          "miimiid-register-feedback"
        );

      if (feedback) {
        feedback.textContent = "";
        feedback.className =
          "miimiid-auth-feedback";
      }
    }

    function setMiimiidRegisterFeedback(
      message,
      type = ""
    ) {
      const feedback =
        document.getElementById(
          "miimiid-register-feedback"
        );

      if (!feedback) {
        return;
      }

      feedback.textContent =
        message || "";

      feedback.className =
        "miimiid-auth-feedback" +
        (type
          ? ` ${type}`
          : "");
    }

    function clearMiimiidVerificationTimer() {
      if (
        miimiidVerificationTimer
      ) {
        clearInterval(
          miimiidVerificationTimer
        );

        miimiidVerificationTimer =
          null;
      }
    }

    function startMiimiidVerificationTimer(
      expiresInSeconds
    ) {
      clearMiimiidVerificationTimer();

      const expires =
        Number(expiresInSeconds);

      if (
        !Number.isFinite(expires) ||
        expires <= 0
      ) {
        return;
      }

      miimiidVerificationExpiresAt =
        Date.now() +
        expires * 1000;

      const update =
        () => {
          const remaining =
            Math.max(
              0,
              Math.ceil(
                (
                  miimiidVerificationExpiresAt -
                  Date.now()
                ) / 1000
              )
            );

          const minutes =
            Math.floor(
              remaining / 60
            );

          const seconds =
            String(
              remaining % 60
            ).padStart(2, "0");

          const timer =
            document.getElementById(
              "miimiid-verification-timer"
            );

          if (timer) {
            timer.textContent =
              remaining > 0
                ? `Code expires in ${minutes}:${seconds}`
                : "Code expired. Request a new code.";
          }

          if (remaining <= 0) {
            clearMiimiidVerificationTimer();
          }
        };

      update();

      miimiidVerificationTimer =
        setInterval(
          update,
          1000
        );
    }

    function resetMiimiidRegistrationFlow() {
      clearMiimiidVerificationTimer();

      miimiidRegistrationStep =
        1;

      miimiidVerificationEmail =
        "";

      miimiidVerificationExpiresAt =
        0;

      const code =
        document.getElementById(
          "miimiid-register-verification-code"
        );

      if (code) {
        code.value = "";
      }

      setMiimiidRegisterFeedback(
        ""
      );

      showMiimiidRegistrationStep(
        1
      );
    }

    async function handleMiimiidRegister(event) {
      event.preventDefault();

      const firstName =
        document
          .getElementById(
            "miimiid-register-first-name"
          )
          ?.value
          .trim() || "";

      const lastName =
        document
          .getElementById(
            "miimiid-register-last-name"
          )
          ?.value
          .trim() || "";

      const email =
        document
          .getElementById(
            "miimiid-register-email"
          )
          ?.value
          .trim() || "";

      const phone =
        document
          .getElementById(
            "miimiid-register-phone"
          )
          ?.value
          .trim() || "";

      const dateOfBirth =
        document
          .getElementById(
            "miimiid-register-dob"
          )
          ?.value || "";

      const password =
        document
          .getElementById(
            "miimiid-register-password"
          )
          ?.value || "";

      const confirm =
        document
          .getElementById(
            "miimiid-register-confirm"
          )
          ?.value || "";

      if (!firstName) {
        showMiimiidRegistrationStep(2);

        setMiimiidRegisterFeedback(
          "Enter your first name.",
          "error"
        );

        return;
      }

      if (!lastName) {
        showMiimiidRegistrationStep(2);

        setMiimiidRegisterFeedback(
          "Enter your last name.",
          "error"
        );

        return;
      }

      if (!email) {
        showMiimiidRegistrationStep(3);

        setMiimiidRegisterFeedback(
          "Enter your email address.",
          "error"
        );

        return;
      }

      if (!phone) {
        showMiimiidRegistrationStep(3);

        setMiimiidRegisterFeedback(
          "Enter your phone number.",
          "error"
        );

        return;
      }

      if (!dateOfBirth) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Enter your date of birth.",
          "error"
        );

        return;
      }

      if (password.length < 8) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Password must be at least 8 characters.",
          "error"
        );

        return;
      }

      if (password !== confirm) {
        showMiimiidRegistrationStep(4);

        setMiimiidRegisterFeedback(
          "Passwords do not match.",
          "error"
        );

        return;
      }

      const submit =
        document.getElementById(
          "miimiid-register-submit"
        );

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Creating your account..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/register",
            {
              firstName,
              lastName,
              email,
              phone,
              dateOfBirth,
              password
            }
          );

        const data =
          response?.data || {};

        if (
          data.verificationRequired
        ) {
          miimiidVerificationEmail =
            email;

          const verificationEmail =
            document.getElementById(
              "miimiid-verification-email"
            );

          if (verificationEmail) {
            verificationEmail.textContent =
              data.maskedEmail ||
              email;
          }

          const verificationCode =
            document.getElementById(
              "miimiid-register-verification-code"
            );

          if (verificationCode) {
            verificationCode.value = "";
            verificationCode.focus();
          }

          showMiimiidRegistrationStep(
            5
          );

          startMiimiidVerificationTimer(
            data.expiresInSeconds
          );

          return;
        }

        throw new Error(
          "Account verification is required."
        );

      } catch (error) {
        console.error(
          "Miimiid registration error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to create your account.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function handleMiimiidVerifyAccount() {
      const code =
        document
          .getElementById(
            "miimiid-register-verification-code"
          )
          ?.value
          .trim() || "";

      const submit =
        document.getElementById(
          "miimiid-verify-account-submit"
        );

      if (!/^\d{6}$/.test(code)) {
        setMiimiidRegisterFeedback(
          "Enter the 6-digit verification code.",
          "error"
        );

        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Verifying your account..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/verify-account",
            {
              email:
                miimiidVerificationEmail,
              code
            }
          );

        const data =
          response?.data || {};

        if (
          !data.verified
        ) {
          throw new Error(
            "Unable to verify your account."
          );
        }

        clearMiimiidVerificationTimer();

        setMiimiidRegisterFeedback(
          "Account verified successfully.",
          "success"
        );

        hideMiimiidAuthView();

        await initializeMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid account verification error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to verify your account.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function handleMiimiidResendVerification() {
      if (!miimiidVerificationEmail) {
        setMiimiidRegisterFeedback(
          "Your verification session is missing. Please start again.",
          "error"
        );

        return;
      }

      const resend =
        document.getElementById(
          "miimiid-resend-verification"
        );

      if (resend) {
        resend.disabled = true;
      }

      setMiimiidRegisterFeedback(
        "Sending a new verification code..."
      );

      try {
        const response =
          await miimiidAuthenticate(
            "/api/auth/resend-verification",
            {
              email:
                miimiidVerificationEmail
            }
          );

        const data =
          response?.data || {};

        if (
          data.verified
        ) {
          clearMiimiidVerificationTimer();

          hideMiimiidAuthView();

          await initializeMiimiidDashboard();

          return;
        }

        const verificationEmail =
          document.getElementById(
            "miimiid-verification-email"
          );

        if (verificationEmail) {
          verificationEmail.textContent =
            data.maskedEmail ||
            miimiidVerificationEmail;
        }

        startMiimiidVerificationTimer(
          data.expiresInSeconds
        );

        setMiimiidRegisterFeedback(
          "A new verification code has been sent.",
          "success"
        );

      } catch (error) {
        console.error(
          "Miimiid verification resend error:",
          error
        );

        setMiimiidRegisterFeedback(
          error.message ||
          "Unable to send a new verification code.",
          "error"
        );

      } finally {
        if (resend) {
          resend.disabled = false;
        }
      }
    }

    async function handleMiimiidForgotPassword(event) {
      event.preventDefault();

      const email =
        document
          .getElementById(
            "miimiid-forgot-identifier"
          )
          ?.value
          .trim();

      const submit =
        document.getElementById(
          "miimiid-forgot-submit"
        );

      if (!email) {
        setMiimiidAuthStatus(
          "Enter your email address.",
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        "Sending reset instructions..."
      );

      try {
        const response =
          await fetch(
            "/api/auth/forgot-password",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                email
              })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result ||
          result.status !== "success"
        ) {
          throw new Error(
            result &&
            result.message
              ? result.message
              : "Unable to request password reset."
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          "Password reset instructions have been sent.",
          "success"
        );

      } catch (error) {
        console.error(
          "Miimiid password reset request error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          "Unable to request password reset.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }


    async function handleMiimiidResetPassword(event) {
      event.preventDefault();

      const token =
        new URLSearchParams(window.location.search)
          .get("resetToken");

      const password =
        document
          .getElementById("miimiid-reset-password")
          ?.value || "";

      const confirmPassword =
        document
          .getElementById("miimiid-reset-confirm")
          ?.value || "";

      const submit =
        document.getElementById("miimiid-reset-submit");

      if (!token) {
        setMiimiidAuthStatus(
          "This password reset link is invalid or missing.",
          "error"
        );
        return;
      }

      if (password.length < 8) {
        setMiimiidAuthStatus(
          "Password must be at least 8 characters.",
          "error"
        );
        return;
      }

      if (password !== confirmPassword) {
        setMiimiidAuthStatus(
          "Passwords do not match.",
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        "Resetting your password..."
      );

      try {
        const response =
          await fetch(
            "/api/auth/reset-password",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
              },
              body: JSON.stringify({
                token,
                password
              })
            }
          );

        const result =
          await response.json();

        if (
          !response.ok ||
          !result ||
          result.status !== "success"
        ) {
          throw new Error(
            result &&
            result.message
              ? result.message
              : "Unable to reset your password."
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          "Your password has been reset successfully.",
          "success"
        );

        const resetForm =
          document.getElementById(
            "miimiid-reset-form"
          );

        if (resetForm) {
          resetForm.reset();
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );

        window.setTimeout(
          () => showMiimiidAuthMode("login"),
          900
        );

      } catch (error) {
        console.error(
          "Miimiid reset password error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          "Unable to reset your password.",
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
        }
      }
    }

    async function logoutMiimiid() {
      try {
        const response =
          await fetch(
            "/api/auth/logout",
            {
              method: "POST",
              credentials: "same-origin",
              headers: {
                "Accept": "application/json"
              }
            }
          );

        if (!response.ok) {
          throw new Error(
            "Logout request failed."
          );
        }

      } catch (error) {
        console.error(
          "Miimiid logout error:",
          error
        );
      } finally {
        miimiidCurrentUser = null;

        window.currentUser = null;
        window.MIIMIID_CURRENT_USER = null;

        currentCourseId = null;
        currentLessonId = null;
        courseDataCache = null;

        showMiimiidAuthView();
      }
    }

    function initializeMiimiidRegistrationFlow() {
      const form =
        document.getElementById(
          "miimiid-register-form"
        );

      if (!form) {
        return;
      }

      if (
        form.dataset.registrationInitialized ===
        "true"
      ) {
        return;
      }

      form.dataset.registrationInitialized =
        "true";

      document
        .getElementById(
          "miimiid-register-get-started"
        )
        ?.addEventListener(
          "click",
          () => {
            showMiimiidRegistrationStep(2);
          }
        );

      document
        .getElementById(
          "miimiid-register-name-next"
        )
        ?.addEventListener(
          "click",
          () => {
            const firstName =
              document
                .getElementById(
                  "miimiid-register-first-name"
                )
                ?.value
                .trim() || "";

            const lastName =
              document
                .getElementById(
                  "miimiid-register-last-name"
                )
                ?.value
                .trim() || "";

            if (!firstName) {
              setMiimiidRegisterFeedback(
                "Enter your first name.",
                "error"
              );
              return;
            }

            if (!lastName) {
              setMiimiidRegisterFeedback(
                "Enter your last name.",
                "error"
              );
              return;
            }

            showMiimiidRegistrationStep(3);
          }
        );

      document
        .getElementById(
          "miimiid-register-contact-next"
        )
        ?.addEventListener(
          "click",
          () => {
            const email =
              document
                .getElementById(
                  "miimiid-register-email"
                )
                ?.value
                .trim() || "";

            const phone =
              document
                .getElementById(
                  "miimiid-register-phone"
                )
                ?.value
                .trim() || "";

            if (
              !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
                email
              )
            ) {
              setMiimiidRegisterFeedback(
                "Enter a valid email address.",
                "error"
              );
              return;
            }

            if (!phone) {
              setMiimiidRegisterFeedback(
                "Enter your phone number.",
                "error"
              );
              return;
            }

            showMiimiidRegistrationStep(4);
          }
        );

      document
        .getElementById(
          "miimiid-register-submit"
        )
        ?.addEventListener(
          "click",
          () => {
            const formEvent =
              new Event(
                "submit",
                {
                  bubbles: true,
                  cancelable: true
                }
              );

            form.dispatchEvent(
              formEvent
            );
          }
        );

      document
        .getElementById(
          "miimiid-verify-account-submit"
        )
        ?.addEventListener(
          "click",
          handleMiimiidVerifyAccount
        );

      document
        .getElementById(
          "miimiid-resend-verification"
        )
        ?.addEventListener(
          "click",
          handleMiimiidResendVerification
        );

      form
        .querySelectorAll(
          "[data-register-back]"
        )
        .forEach(button => {
          button.addEventListener(
            "click",
            () => {
              const target =
                Number(
                  button.getAttribute(
                    "data-register-back"
                  )
                );

              showMiimiidRegistrationStep(
                target
              );
            }
          );
        });
    }


    function initializeMiimiidAuth() {
      if (miimiidAuthInitialized) {
        return;
      }

      miimiidAuthInitialized = true;

      const loginForm =
        document.getElementById(
          "miimiid-login-form"
        );

      const registerForm =
        document.getElementById(
          "miimiid-register-form"
        );

      const forgotForm =
        document.getElementById(
          "miimiid-forgot-form"
        );

      if (loginForm) {
        loginForm.addEventListener(
          "submit",
          handleMiimiidLogin
        );
      }

      if (registerForm) {
        registerForm.addEventListener(
          "submit",
          handleMiimiidRegister
        );
      }

      if (forgotForm) {
        forgotForm.addEventListener(
          "submit",
          handleMiimiidForgotPassword
        );
      }

      const resetForm =
        document.getElementById(
          "miimiid-reset-form"
        );

      if (resetForm) {
        resetForm.addEventListener(
          "submit",
          handleMiimiidResetPassword
        );
      }

      document
        .getElementById("miimiid-show-register")
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("register")
        );

      document
        .getElementById("miimiid-show-forgot")
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("forgot")
        );

      document
        .getElementById(
          "miimiid-show-login-from-register"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );

      document
        .getElementById(
          "miimiid-show-login-from-forgot"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );

      document
        .getElementById(
          "miimiid-show-login-from-reset"
        )
        ?.addEventListener(
          "click",
          () => showMiimiidAuthMode("login")
        );
    }

    function initializeMiimiidPasswordToggles() {
      document
        .querySelectorAll("[data-password-toggle]")
        .forEach(toggle => {
          if (toggle.dataset.initialized === "true") {
            return;
          }

          toggle.dataset.initialized = "true";

          toggle.addEventListener("click", () => {
            const inputId =
              toggle.getAttribute("data-password-toggle");

            const input =
              document.getElementById(inputId);

            if (!input) {
              return;
            }

            const showing =
              input.type === "text";

            input.type =
              showing ? "password" : "text";

            const showIcon =
              toggle.querySelector(
                ".miimiid-password-icon-show"
              );

            const hideIcon =
              toggle.querySelector(
                ".miimiid-password-icon-hide"
              );

            if (showIcon) {
              showIcon.style.display =
                showing ? "block" : "none";
            }

            if (hideIcon) {
              hideIcon.style.display =
                showing ? "none" : "block";
            }

            toggle.setAttribute(
              "aria-label",
              miimiidDashboardTranslate(
                showing
                  ? "authShowPassword"
                  : "authHidePassword"
              )
            );

            toggle.setAttribute(
              "aria-pressed",
              showing ? "false" : "true"
            );
          });
        });
    }


    async function initializeMiimiidApplication() {
      initializeMiimiidPasswordToggles();

      initializeMiimiidRegistrationFlow();

      initializeMiimiidAuth();

      const authLoading =
        document.getElementById(
          "miimiid-auth-loading"
        );

      const authView =
        document.getElementById(
          "miimiid-auth-view"
        );

      const authCard =
        document.getElementById(
          "miimiid-auth-card"
        );

      const appShell =
        document.getElementById(
          "miimiid-app-shell"
        );

      /*
       * Never expose dashboard/course data while
       * authentication state is unknown.
       */
      if (appShell) {
        appShell.classList.add("hidden");
      }

      if (authView) {
        authView.classList.remove("hidden");
      }

      if (authLoading) {
        authLoading.classList.remove("hidden");
      }

      if (authCard) {
        authCard.classList.add("hidden");
      }

      const resetToken =
        new URLSearchParams(window.location.search)
          .get("resetToken");

      if (resetToken) {
        showMiimiidAuthView();
        showMiimiidAuthMode("reset");
        return;
      }

      const user =
        await loadMiimiidCurrentUser();

      if (!user) {
        showMiimiidAuthView();
        return;
      }

      if (authView) {
        authView.classList.add("hidden");
      }

      if (appShell) {
        appShell.classList.remove("hidden");
      }

      await initializeMiimiidDashboard();
    }


    /* =========================================
       APPLICATION STATE
       ========================================= */

let currentQuizzes = [];
let selectedQuizAnswers = [];
let quizSubmitted = false;
let currentCourseId = null;
let currentLessonId = null;
let currentQuiz = null;
let courseDataCache = null;

    /* =========================================
       FETCH ALL COURSES
       ========================================= */

async function fetchCourses() {

  showLoading(true);
  hideError();

  const container =
    document.getElementById("courses-container");

  try {

    const response =
      await fetch(`/api/learn/courses?language=${encodeURIComponent(getSavedLanguage())}`);

    const result =
      await response.json();

    console.log("Courses API response:", result);

    if (
      !response.ok ||
      result.status !== "success"
    ) {
      throw new Error(
        result.message ||
        miimiidTranslate(
          "unableToLoadCourses",
          getSavedLanguage()
        )
      );
    }

    const courses =
      Array.isArray(result.data)
        ? result.data
        : [];

    if (courses.length === 0) {

      container.innerHTML = `
        <div class="card">
          <p>${miimiidTranslate("noModules", getSavedLanguage())}</p>
        </div>
      `;

      return;
    }

    container.innerHTML =
      courses
        .map(
          course => `
            <div class="card">

              <h3>
                ${escapeHtml(
                  course.title ||
                  ""
                )}
              </h3>

              <p>
                ${escapeHtml(
                  course.description ||
                  miimiidTranslate(
                    "noDescription",
                    getSavedLanguage()
                  )
                )}
              </p>

              <button
                class="btn"
                onclick="openCourse('${course._id}')"
              >
                ${miimiidTranslate(
                  "openCourse",
                  getSavedLanguage()
                )}
              </button>

            </div>
          `
        )
        .join("");

  } catch (error) {

    console.error(
      "fetchCourses error:",
      error
    );

    showError(
      miimiidTranslate(
        "unableToLoadCourses",
        getSavedLanguage()
      )
    );

  } finally {

    showLoading(false);

  }
}

/* =========================================
       OPEN COURSE
       ========================================= */

async function openCourse(courseId) {
  if (!courseId) {
    showError(
      miimiidTranslate(
        "invalidCourseId",
        getSavedLanguage()
      )
    );
    return;
  }

  currentCourseId = courseId;

  showLoading(true);
  hideError();

  try {
    const response = await fetch(
      `/api/learn/courses/${courseId}?language=${encodeURIComponent(getSavedLanguage())}`
    );

    const data = await response.json();

    if (
      response.ok &&
      data.status === "success" &&
      data.data
    ) {
      courseDataCache = data.data;

      document
        .getElementById("course-list-view")
        .classList.add("hidden");

      document
        .getElementById("lesson-view")
        .classList.add("hidden");

      document
        .getElementById("course-detail-view")
        .classList.remove("hidden");

      document
        .getElementById("detail-course-title")
        .innerText =
          courseDataCache.title ||
          "";

      document
        .getElementById("detail-course-desc")
        .innerText =
          courseDataCache.description ||
          miimiidTranslate(
            "noDescription",
            getSavedLanguage()
          );

      renderModules(
        courseDataCache.modules
      );

      await loadCourseProgress(
        courseId
      );

    } else {
      console.error(
        "Course loading failed:",
        data
      );

      showError(
        data.message ||
        miimiidTranslate(
          "unableToLoadCourse",
          getSavedLanguage()
        )
      );
    }

  } catch (error) {
    console.error(
      "openCourse error:",
      error
    );

    showError(
      miimiidTranslate(
        "unableToConnect",
        getSavedLanguage()
      )
    );

  } finally {
    showLoading(false);
  }
}

    /* =========================================
       LOAD COURSE PROGRESS
       ========================================= */

async function loadCourseProgress(courseId) {

  const card =
    document.getElementById(
      "course-progress-card"
    );

  const percent =
    document.getElementById(
      "course-progress-percent"
    );

  const bar =
    document.getElementById(
      "course-progress-bar"
    );

  const text =
    document.getElementById(
      "course-progress-text"
    );

  if (
    !card ||
    !percent ||
    !bar ||
    !text
  ) {
    return;
  }

  try {

    const userId =
      getMiimiidCurrentUserId();

    if (!userId) {
      card.classList.add("hidden");
      return;
    }

    const response =
      await fetch(
        `/api/learn/courses/${courseId}/progress/${encodeURIComponent(userId)}`
      );

    const data =
      await response.json();

    if (
      !response.ok ||
      data.status !== "success" ||
      !data.data
    ) {
      card.classList.add("hidden");
      return;
    }

    const progress =
      data.data;

    const progressPercentage =
      Number(
        progress.progressPercentage || 0
      );

    const completedLessons =
      Number(
        progress.completedLessons || 0
      );

    const totalLessons =
      Number(
        progress.totalLessons || 0
      );

    percent.innerText =
      `${progressPercentage}%`;

    bar.style.width =
      `${progressPercentage}%`;

    text.innerText =
      `${completedLessons} of ${totalLessons} lessons completed`;

    card.classList.remove("hidden");

    /*
     * Keep authoritative completion IDs
     * available to the lesson/module UI.
     */
    courseDataCache.completedLessonIds =
      Array.isArray(
        progress.completedLessonIds
      )
        ? progress.completedLessonIds
        : [];

  } catch (error) {

    console.error(
      "Course progress loading error:",
      error
    );

    card.classList.add("hidden");
  }
}


/* =========================================
       RENDER MODULES
       ========================================= */

    function renderModules(modules) {

      const container =
        document.getElementById(
          "modules-container"
        );

      if (
        !Array.isArray(modules) ||
        modules.length === 0
      ) {

        container.innerHTML = `
          <div class="card">
            <p>
              ${miimiidTranslate(
                "noModules",
                getSavedLanguage()
              )}
            </p>
          </div>
        `;

        return;
      }

      container.innerHTML =
        modules.map(
          (module, moduleIndex) => {

            const lessons =
              Array.isArray(
                module.lessons
              )
                ? module.lessons
                : [];

            const completedLessonIds =
              Array.isArray(
                courseDataCache &&
                courseDataCache.completedLessonIds
              )
                ? courseDataCache.completedLessonIds
                : [];

            const completedCount =
              lessons.filter(
                lesson =>
                  completedLessonIds.includes(
                    String(lesson._id)
                  )
              ).length;

            const moduleIsComplete =
              lessons.length > 0 &&
              completedCount === lessons.length;

            const currentLanguage =
              getSavedLanguage();

            const moduleProgressText =
              lessons.length > 0
                ? moduleIsComplete
                  ? miimiidTranslate(
                      "moduleComplete",
                      currentLanguage
                    )
                  : `${completedCount} of ${lessons.length} ${miimiidTranslate(
                      "lessonsComplete",
                      currentLanguage
                    )}`
                : miimiidTranslate(
                    "noLessonsYet",
                    currentLanguage
                  );

            return `

              <div class="card">

                <p
                  class="module-progress ${
                    moduleIsComplete
                      ? "module-complete"
                      : ""
                  }"
                >
                  ${moduleProgressText}
                </p>

              <h3>
              ${escapeHtml(
              module.title ||
             `Module ${moduleIndex + 1}`
             )}
          </h3> 

                ${
                  lessons.length === 0

                    ? `
                      <p>
                        ${miimiidTranslate(
                          "noLessons",
                          getSavedLanguage()
                        )}
                      </p>
                    `

                    : `
                      <ul>

                        ${
                          lessons.map(
                            lesson => `

                              <li>

                                <div
                                  class="lesson-row ${
                                    completedLessonIds.includes(
                                      String(lesson._id)
                                    )
                                      ? "completed"
                                      : ""
                                  }"
                                >

                                  <span>
                                    ${
                                      completedLessonIds.includes(
                                        String(lesson._id)
                                      )
                                        ? `<span class="lesson-completed">${miimiidTranslate(
                                            "completed",
                                            getSavedLanguage()
                                          )}</span>`
                                        : ""
                                    }
                                    ${escapeHtml(
                                      lesson.title ||
                                      miimiidTranslate("untitledLesson", getSavedLanguage())
                                    )}
                                  </span>

                                  <button
                                    class="btn btn-sm"
                                    onclick="openLesson('${lesson._id}')"
                                  >
                                    ${
                                      completedLessonIds.includes(
                                        String(lesson._id)
                                      )
                                        ? miimiidTranslate(
                                            "reviewLesson",
                                            getSavedLanguage()
                                          )
                                        : miimiidTranslate(
                                            "startLesson",
                                            getSavedLanguage()
                                          )
                                    }
                                  </button>

                                </div>

                              </li>

                            `
                          ).join("")
                        }

                      </ul>
                    `
                }

              </div>

            `;

          }
        ).join("");

    }


    /* =========================================
       OPEN LESSON
       ========================================= */

    function openLesson(lessonId) {

      currentLessonId = lessonId;

      if (
        !courseDataCache ||
        !Array.isArray(
          courseDataCache.modules
        )
      ) {

        showError(
          "Course data is unavailable."
        );

        return;
      }

      let targetLesson = null;
      let targetModule = null;
      let targetModuleIndex = -1;
      let targetLessonIndex = -1;

      /*
       * Find the lesson inside:
       *
       * Course
       *   -> Modules
       *       -> Lessons
       */

      for (
        const module
        of courseDataCache.modules
      ) {

        if (
          !Array.isArray(
            module.lessons
          )
        ) {
          continue;
        }

        const found =
          module.lessons.find(
            lesson =>
              String(
                lesson._id
              ) === String(
                lessonId
              )
          );

        if (found) {

          targetLesson = found;
          targetModule = module;
          targetModuleIndex =
            courseDataCache.modules.indexOf(
              module
            );
          targetLessonIndex =
            module.lessons.indexOf(
              found
            );

          break;

        }

      }

      if (!targetLesson) {

        document.getElementById("quiz-result").innerHTML =
          `<span class="error-text">${miimiidTranslate("lessonNotFound", getSavedLanguage())}</span>`;

        return;
      }

      document
        .getElementById(
          "course-detail-view"
        )
        .classList.add(
          "hidden"
        );

      document
        .getElementById(
          "lesson-view"
        )
        .classList.remove(
          "hidden"
        );

      document
        .getElementById(
          "lesson-title"
        )
        .innerText =
          targetLesson.title ||
          miimiidTranslate("untitledLesson", getSavedLanguage());

      const lessonMeta =
        document.getElementById(
          "lesson-meta"
        );

      const lessonMetaModule =
        document.getElementById(
          "lesson-meta-module"
        );

      const lessonMetaDetails =
        document.getElementById(
          "lesson-meta-details"
        );

      const lessonMetaDescription =
        document.getElementById(
          "lesson-meta-description"
        );

      const totalLessons =
        Array.isArray(
          targetModule.lessons
        )
          ? targetModule.lessons.length
          : 0;

      const lessonNumber =
        targetLessonIndex + 1;

      const duration =
        Number(
          targetLesson.estimatedDuration
        );

      lessonMetaModule.innerText =
        targetModule.title ||
        `Module ${targetModuleIndex + 1}`;

      lessonMetaDetails.innerText =
        `Lesson ${lessonNumber} of ${totalLessons}` +
        (
          duration > 0
            ? ` · ${duration} min`
            : ""
        );

      const description =
        targetLesson.description ||
        "";

      lessonMetaDescription.innerText =
        description;

      lessonMeta.classList.toggle(
        "hidden",
        !description &&
        !(duration > 0) &&
        !targetModule.title
      );

      /*
       * IMPORTANT:
       *
       * Your Lesson model uses
       * contentBlocks.
       *
       * It does NOT use:
       *
       * lesson.content
       */

      renderLessonContent(
        targetLesson.contentBlocks
      );

      renderQuiz(
        targetLesson
      );

      /*
       * Keep the AI Tutor aware of the lesson the learner
       * is currently studying. This is local frontend
       * context only; no OpenAI API call happens here.
       */
      if (typeof setMiimiidAITutorLessonContext === "function") {
        setMiimiidAITutorLessonContext({
          courseId: currentCourseId,
          courseTitle:
            (
              courseDataCache &&
              typeof courseDataCache.title === "string"
            )
              ? courseDataCache.title
              : "",
          moduleTitle:
            targetModule.title || "",
          moduleNumber:
            targetModuleIndex + 1,
          lessonId: targetLesson._id || lessonId,
          lessonTitle:
            targetLesson.title || "",
          lessonDescription:
            targetLesson.description || "",
          contentBlocks:
            Array.isArray(targetLesson.contentBlocks)
              ? targetLesson.contentBlocks
              : [],
          language:
            getSavedLanguage()
        });
      }

      updateLessonNavigation();

    }


    /* =========================================
       RENDER LESSON CONTENT
       ========================================= */

    function renderLessonContent(
      contentBlocks
    ) {

      const container =
        document.getElementById(
          "lesson-content"
        );

      if (
        !Array.isArray(
          contentBlocks
        ) ||
        contentBlocks.length === 0
      ) {

        container.innerHTML = `
          <div class="card">
            <p>
              ${miimiidTranslate("noLessonContent", getSavedLanguage())}
            </p>
          </div>
        `;

        return;
      }

      /*
       * Sort blocks by their database order.
       */

      const blocks =
        [...contentBlocks].sort(
          (a, b) =>
            Number(a.order || 0) -
            Number(b.order || 0)
        );

      container.innerHTML =
        blocks
          .map(
            block =>
              renderContentBlock(
                block
              )
          )
          .join("");

    }


    /* =========================================
       RENDER ONE CONTENT BLOCK
       ========================================= */

    function renderContentBlock(block) {
      // Support rich blocks that store explanatory content in a points array.
      // Some lesson summaries use data.points instead of data.text.
      if (
        block &&
        block.data &&
        Array.isArray(block.data.points) &&
        block.data.points.length > 0 &&
        !block.data.text
      ) {
        block = {
          ...block,
          data: {
            ...block.data,
            text: block.data.points.join("\n\n")
          }
        };
      }



      if (!block) {
        return "";
      }

      const type =
        block.type || "text";

      const data =
        block.data;

      const text =
        getBlockText(data);

      switch (type) {

        case "heading":

          return `
            <div
              class="content-block"
            >

              <h3
                class="content-heading"
              >
                ${escapeHtml(text)}
              </h3>

            </div>
          `;


        case "text":

          return `
            <div
              class="content-block content-text"
            >
              ${escapeHtml(text)}
            </div>
          `;


        case "example":

          return `
            <div
              class="content-block content-example"
            >

              <strong>
                ${miimiidTranslate("example", getSavedLanguage())}
              </strong>

              <p>
                ${escapeHtml(text)}
              </p>

            </div>
          `;


        case "callout":

          return `
            <div
              class="content-block content-callout"
            >

              <strong>
                ${miimiidTranslate("important", getSavedLanguage())}
              </strong>

              <p>
                ${escapeHtml(text)}
              </p>

            </div>
          `;


        case "formula":

          return `
            <div
              class="content-block content-formula"
            >
              ${escapeHtml(text)}
            </div>
          `;


        case "summary":

          return `
            <div
              class="content-block content-summary"
            >

              <strong>
                ${miimiidTranslate("summary", getSavedLanguage())}
              </strong>

              <p>
                ${escapeHtml(text)}
              </p>

            </div>
          `;


        case "image":

          return renderImageBlock(
            data
          );


        case "video":

          return renderVideoBlock(
            data
          );


        case "interactive":

          return `
            <div
              class="content-block card"
            >
              <p>
                ${escapeHtml(text)}
              </p>
            </div>
          `;


        default:

          return `
            <div
              class="content-block"
            >
              <p>
                ${escapeHtml(text)}
              </p>
            </div>
          `;

      }

    }


    /* =========================================
       EXTRACT TEXT FROM CONTENT DATA
       ========================================= */

function getBlockText(data) {

  if (
    data === null ||
    data === undefined
  ) {
    return "";
  }

  if (
    typeof data === "string"
  ) {
    return data;
  }

  if (
    typeof data === "number" ||
    typeof data === "boolean"
  ) {
    return String(data);
  }

  if (
    typeof data === "object"
  ) {

    // Some lesson blocks are stored as:
    // { order: 1, data: { text: "..." } }
    // Unwrap the nested data object first.
    if (
      data.data &&
      typeof data.data === "object"
    ) {
      const nestedText = getBlockText(data.data);

      if (nestedText) {
        return nestedText;
      }
    }

    return (
      data.text ??
      data.content ??
      data.value ??
      data.description ??
      data.body ??
      data.formula ??
      data.equation ??
      data.expression ??
      data.title ??
      ""
    );

  }

  return String(data);
}

    /* =========================================
       IMAGE BLOCK
       ========================================= */

    function renderImageBlock(data) {

      const source =
        getMediaSource(data);

      if (!source) {

        return `
          <div class="content-block">
            <p>
              ${miimiidTranslate('imageUnavailable', getSavedLanguage())}
            </p>
          </div>
        `;

      }

      const alt =
        data &&
        typeof data === "object"
          ? (
              data.alt ||
              data.caption ||
              miimiidTranslate('lessonImage', getSavedLanguage())
            )
          : miimiidTranslate('lessonImage', getSavedLanguage());

const caption =
        data &&
        typeof data === "object"
          ? data.caption || ""
          : "";

      return `

        <div class="content-block">

          <img
            class="content-image"
            src="${escapeAttribute(source)}"
            alt="${escapeAttribute(alt)}"
            loading="lazy"
          >

          ${
            caption
              ? `
                <div class="content-caption">
                  ${escapeHtml(caption)}
                </div>
              `
              : ""
          }

        </div>

      `;

    }


    /* =========================================
   VIDEO BLOCK
   ========================================= */

function renderVideoBlock(data) {

  const source =
    getMediaSource(data);

  if (!source) {

    return `
      <div class="content-block">
        <p>
          ${miimiidTranslate('videoUnavailable', getSavedLanguage())}
        </p>
      </div>
    `;

  }

  return `

    <div class="content-block">

      <div class="video-wrapper">

        <video
          class="content-video"
          controls
          preload="metadata"
          playsinline
        >

          <source
            src="${escapeAttribute(source)}"
          >

          ${miimiidTranslate('browserVideoUnsupported', getSavedLanguage())}

        </video>

        <div class="video-watermark">
          Miimiid AI Tutor
        </div>

      </div>

    </div>

  `;

}


    /* =========================================
       GET MEDIA URL
       ========================================= */

    function getMediaSource(data) {

      if (
        typeof data === "string"
      ) {
        return data;
      }

      if (
        !data ||
        typeof data !== "object"
      ) {
        return "";
      }

      return (
        data.url ||
        data.src ||
        data.source ||
        data.href ||
        ""
      );

    }


    /* =========================================
       QUIZ
       ========================================= */

function renderQuiz(lesson) {

  const section =
    document.getElementById("quiz-section");

  const question =
    document.getElementById("quiz-question");

  const options =
    document.getElementById("quiz-options");

  const result =
    document.getElementById("quiz-result");

  result.innerHTML = "";

  currentQuizzes =
    Array.isArray(lesson.quizzes)
      ? lesson.quizzes
      : [];

  selectedQuizAnswers =
    new Array(currentQuizzes.length);

  quizSubmitted = false;

  if (currentQuizzes.length === 0) {

    section.classList.add("hidden");
    options.innerHTML = "";

    return;
  }

  section.classList.remove("hidden");

  /*
   * Render every question according
   * to its question type.
   */
  options.innerHTML =
    currentQuizzes
      .map((quiz, quizIndex) => {

        const questionType =
          quiz.questionType || "multiple-choice";

        /*
         * -----------------------------------------
         * MULTIPLE-CHOICE / TRUE-FALSE
         * -----------------------------------------
         */
        if (
          questionType === "multiple-choice" ||
          questionType === "true-false"
        ) {

          const quizOptions =
            Array.isArray(quiz.options)
              ? quiz.options
              : [];

          return `
            <div
              class="card"
              style="margin-top: 15px;"
            >

              <p>
                <strong>
                  ${quizIndex + 1}.
                  ${escapeHtml(
                    quiz.question ||
                    miimiidTranslate("questionUnavailable", getSavedLanguage())
                  )}
                </strong>
              </p>

              ${
                quizOptions.length > 0

                  ? quizOptions
                      .map(
                        (option, optionIndex) => `
                          <label
                            class="quiz-option"
                          >

                            <input
                              type="radio"
                              name="quiz-${quizIndex}"
                              value="${optionIndex}"
                              onchange="
                                selectedQuizAnswers[${quizIndex}]
                                = ${optionIndex};
                              "
                            >

                            ${escapeHtml(option)}

                          </label>
                        `
                      )
                      .join("")

                  : `
                    <p class="error-text">
                      ${miimiidTranslate('noAnswerOptions', getSavedLanguage())}
                    </p>
                  `
              }

            </div>
          `;
        }

        /*
         * -----------------------------------------
         * CALCULATION QUESTION
         * -----------------------------------------
         */
        if (questionType === "calculate") {

          return `
            <div
              class="card"
              style="margin-top: 15px;"
            >

              <p>
                <strong>
                  ${quizIndex + 1}.
                  ${escapeHtml(
                    quiz.question ||
                    miimiidTranslate('calculationQuestionUnavailable', getSavedLanguage())
                  )}
                </strong>
              </p>

              <label>
                <strong>
                  ${miimiidTranslate('yourAnswer', getSavedLanguage())}:
                </strong>
              </label>

               <input
               type="number"
               class="quiz-option calculation-input"
               id="calculation-answer-${quizIndex}"
                placeholder="${miimiidTranslate('enterYourAnswer', getSavedLanguage())}"
                step="any"
                oninput="
                  selectedQuizAnswers[${quizIndex}]
                  = this.value;
                "
              >

              ${
                quiz.hint
                  ? `
                    <p>
                      <small>
                        ${miimiidTranslate('hint', getSavedLanguage())}:
                        ${escapeHtml(quiz.hint)}
                      </small>
                    </p>
                  `
                  : ""
              }

            </div>
          `;
        }

        /*
         * -----------------------------------------
         * UNKNOWN QUESTION TYPE
         * -----------------------------------------
         */
        return `
          <div
            class="card"
            style="margin-top: 15px;"
          >

            <p>
              <strong>
                ${quizIndex + 1}.
                ${escapeHtml(
                  quiz.question ||
                  miimiidTranslate("questionUnavailable", getSavedLanguage())
                )}
              </strong>
            </p>

            <p class="error-text">
              ${miimiidTranslate("unsupportedQuestionType", getSavedLanguage())}
              ${escapeHtml(questionType)}
            </p>

          </div>
        `;

      })
      .join("");

  question.innerText =
    miimiidTranslate(
      "questionInstruction",
      getSavedLanguage()
    );
}

    /* =========================================
       SUBMIT QUIZ
       ========================================= */

async function submitQuiz() {

  if (
    !currentLessonId ||
    currentQuizzes.length === 0
  ) {

    const result =
      document.getElementById("quiz-result");

    result.innerHTML = `
      <span class="error-text">
        ${miimiidTranslate("noQuizAvailable", getSavedLanguage())}
      </span>
    `;

    return;
  }

  /*
   * Make sure every question has an answer.
   */
  const unanswered =
    currentQuizzes.findIndex(
      (quiz, index) => {

        const answer =
          selectedQuizAnswers[index];

        if (
          answer === undefined ||
          answer === null ||
          answer === ""
        ) {
          return true;
        }

        return false;
      }
    );

  if (unanswered !== -1) {

    const result =
      document.getElementById("quiz-result");

    result.innerHTML = `
      <span class="error-text">
        ${miimiidTranslate("answerAllQuestions", getSavedLanguage())}
      </span>
    `;

    return;
  }

  /*
   * Convert calculation answers
   * from strings to numbers.
   *
   * Multiple-choice and true-false
   * answers remain option indexes.
   */
  const answersForSubmission =
    currentQuizzes.map(
      (quiz, index) => {

        if (
          quiz.questionType === "calculate"
        ) {

          return Number(
            selectedQuizAnswers[index]
          );

        }

        return selectedQuizAnswers[index];

      }
    );

  const button =
    document.getElementById(
      "quiz-submit-btn"
    );

  const result =
    document.getElementById(
      "quiz-result"
    );

  button.disabled = true;
  button.innerText = miimiidTranslate("checking", getSavedLanguage());

  try {

    const response =
      await fetch(
        "/api/learn/quiz/submit",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            lessonId:
              currentLessonId,

            submittedAnswers:
              answersForSubmission

          })
        }
      );

    const data =
      await response.json();

    if (
      response.ok &&
      data.status === "success"
    ) {

      const quizResult =
        data.data;

      if (quizResult.passed) {

        result.innerHTML = `
          <span class="success-text">
            ${miimiidTranslate("quizComplete", getSavedLanguage())}
            ${miimiidTranslate("score", getSavedLanguage())}: ${quizResult.score}%.
            ${miimiidTranslate("youGot", getSavedLanguage())}
            ${quizResult.correctAnswers}
            ${miimiidTranslate("outOf", getSavedLanguage())}
            ${quizResult.totalQuestions}
            ${miimiidTranslate("correct", getSavedLanguage())}
            ${miimiidTranslate("canCompleteLesson", getSavedLanguage())}
          </span>
        `;

        quizSubmitted = true;

      } else {

        result.innerHTML = `
          <span class="error-text">
            ${miimiidTranslate("score", getSavedLanguage())}: ${quizResult.score}%.
            ${miimiidTranslate("youGot", getSavedLanguage())}
            ${quizResult.correctAnswers}
            ${miimiidTranslate("outOf", getSavedLanguage())}
            ${quizResult.totalQuestions}
            ${miimiidTranslate("correct", getSavedLanguage())}
            ${miimiidTranslate("reviewLessonTryAgain", getSavedLanguage())}
          </span>
        `;

        quizSubmitted = false;
      }

    } else {

      result.innerHTML = `
        <span class="error-text">
          ${
            data.message ||
            miimiidTranslate(
              "unableToValidateQuiz",
              getSavedLanguage()
            )
          }
        </span>
      `;

    }

  } catch (error) {

    console.error(
      "Quiz submission error:",
      error
    );

    result.innerHTML = `
      <span class="error-text">
        ${miimiidTranslate("unableToConnect", getSavedLanguage())}
      </span>
    `;

  } finally {

    button.disabled = false;
    button.innerText =
      miimiidTranslate(
        "submitAnswer",
        getSavedLanguage()
      );

  }
}

    /* =========================================
       LESSON NAVIGATION
       ========================================= */

    function updateLessonNavigation() {

      const navigation =
        document.getElementById(
          "lesson-navigation"
        );

      const previousButton =
        document.getElementById(
          "previous-lesson-btn"
        );

      const nextButton =
        document.getElementById(
          "next-lesson-btn"
        );

      if (
        !navigation ||
        !previousButton ||
        !nextButton ||
        !courseDataCache ||
        !Array.isArray(
          courseDataCache.modules
        )
      ) {
        return;
      }

      const allLessons = [];

      courseDataCache.modules.forEach(
        module => {

          if (
            !Array.isArray(
              module.lessons
            )
          ) {
            return;
          }

          module.lessons.forEach(
            lesson => {
              allLessons.push(lesson);
            }
          );

        }
      );

      const currentIndex =
        allLessons.findIndex(
          lesson =>
            String(
              lesson._id
            ) === String(
              currentLessonId
            )
        );

      if (currentIndex === -1) {
        navigation.classList.add(
          "hidden"
        );
        return;
      }

      const hasPrevious =
        currentIndex > 0;

      const hasNext =
        currentIndex <
        allLessons.length - 1;

      previousButton.classList.toggle(
        "hidden",
        !hasPrevious
      );

      nextButton.classList.toggle(
        "hidden",
        !hasNext
      );

      navigation.classList.toggle(
        "hidden",
        !hasPrevious &&
        !hasNext
      );
    }


    function navigateToLesson(
      direction
    ) {

      if (
        !courseDataCache ||
        !Array.isArray(
          courseDataCache.modules
        )
      ) {
        return;
      }

      const allLessons = [];

      courseDataCache.modules.forEach(
        module => {

          if (
            !Array.isArray(
              module.lessons
            )
          ) {
            return;
          }

          module.lessons.forEach(
            lesson => {
              allLessons.push(lesson);
            }
          );

        }
      );

      const currentIndex =
        allLessons.findIndex(
          lesson =>
            String(
              lesson._id
            ) === String(
              currentLessonId
            )
        );

      if (currentIndex === -1) {
        return;
      }

      let targetIndex =
        currentIndex;

      if (
        direction === "previous"
      ) {
        targetIndex =
          currentIndex - 1;
      } else if (
        direction === "next"
      ) {
        targetIndex =
          currentIndex + 1;
      }

      if (
        targetIndex < 0 ||
        targetIndex >=
          allLessons.length
      ) {
        return;
      }

      const targetLesson =
        allLessons[targetIndex];

      if (!targetLesson) {
        return;
      }

      openLesson(
        targetLesson._id
      );
    }


    /* =========================================
       COMPLETE LESSON
       ========================================= */

    async function completeLesson() {

  if (!currentLessonId) {

    document.getElementById("quiz-result").innerHTML =
      `<span class="error-text">${miimiidTranslate("noLessonSelected", getSavedLanguage())}</span>`;

    return;
  }

  /*
   * If the lesson has quizzes,
   * require the quiz to be submitted first.
   */
  if (
    currentQuizzes.length > 0 &&
    !quizSubmitted
  ) {

    document.getElementById("quiz-result").innerHTML =
      `<span class="error-text">${miimiidTranslate("submitQuizFirst", getSavedLanguage())}</span>`;

    return;
  }

  const button =
    document.getElementById(
      "complete-btn"
    );

  button.disabled = true;

  button.innerText =
    miimiidTranslate("saving", getSavedLanguage());

  try {

    const response =
      await fetch(
        `/api/learn/lessons/${currentLessonId}/complete`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json"
          },

          body: JSON.stringify({

            userId:
              getMiimiidCurrentUserId(),

            submittedAnswers:
              selectedQuizAnswers

          })
        }
      );

    const data =
      await response.json();

    if (
      response.ok &&
      data.status === "success"
    ) {

      document.getElementById("quiz-result").innerHTML =
        `<span class="success-text">${miimiidTranslate("lessonCompletedSuccessfully", getSavedLanguage())}</span>`;

      /*
       * Reload the course so the
       * frontend has fresh data.
       */
      await openCourse(
        currentCourseId
      );

    } else {

      document.getElementById("quiz-result").innerHTML =
        `<span class="error-text">${data.message || miimiidTranslate("failedToSaveProgress", getSavedLanguage())}</span>`;

    }

  } catch (error) {

    console.error(
      "Complete lesson error:",
      error
    );

    document.getElementById("quiz-result").innerHTML =
      `<span class="error-text">${miimiidTranslate(
        "failedToSaveProgress",
        getSavedLanguage()
      )}</span>`;

  } finally {

    button.disabled = false;

    button.innerText =
      miimiidTranslate(
        "completeLesson",
        getSavedLanguage()
      );
  }
}


    /* =========================================
       BACK TO MODULES
       ========================================= */

    function backToModules() {

      document
        .getElementById(
          "lesson-view"
        )
        .classList.add(
          "hidden"
        );

      document
        .getElementById(
          "course-detail-view"
        )
        .classList.remove(
          "hidden"
        );

    }


    /* =========================================
       BACK TO COURSES
       ========================================= */

    function goBackToCourses() {

      currentCourseId = null;
      currentLessonId = null;
      courseDataCache = null;

      document
        .getElementById(
          "course-detail-view"
        )
        .classList.add(
          "hidden"
        );

      document
        .getElementById(
          "lesson-view"
        )
        .classList.add(
          "hidden"
        );

      document
        .getElementById(
          "course-list-view"
        )
        .classList.remove(
          "hidden"
        );

      fetchCourses();

    }


    /* =========================================
       LOADING
       ========================================= */

    function showLoading(isLoading) {

      const loading =
        document.getElementById(
          "loading"
        );

      if (isLoading) {

        loading.classList.remove(
          "hidden"
        );

      } else {

        loading.classList.add(
          "hidden"
        );

      }

    }


    /* =========================================
       ERROR
       ========================================= */

    function showError(message) {

      const error =
        document.getElementById(
          "error"
        );

      error.innerText =
        message ||
        miimiidTranslate(
          "somethingWentWrong",
          getSavedLanguage()
        );

      error.classList.remove(
        "hidden"
      );

    }


    function hideError() {

      document
        .getElementById(
          "error"
        )
        .classList.add(
          "hidden"
        );

    }


    /* =========================================
       HTML ESCAPING
       ========================================= */

    function escapeHtml(value) {

      const div =
        document.createElement(
          "div"
        );

      div.textContent =
        value === null ||
        value === undefined
          ? ""
          : String(value);

      return div.innerHTML;

    }


    function escapeAttribute(value) {

      return escapeHtml(
        value
      )
      .replace(
        /"/g,
        "&quot;"
      )
      .replace(
        /'/g,
        "&#39;"
      );

    }


    /* =========================================
       START APPLICATION
       ========================================= */

    fetchCourses();

  


  /* ================================
     MIIMIID LANGUAGE SELECTOR
     ================================ */

  const MIIMIID_LANGUAGE_KEY = "miimiid-language";

  const MIIMIID_LANGUAGES = {
    en: {

      name: "English",
      nativeName: "English"
    },
    es: {

      name: "Spanish",
      nativeName: "Español"
    },
    fr: {

      name: "French",
      nativeName: "Français"
    },
    de: {

      name: "German",
      nativeName: "Deutsch"
    },
    pt: {

      name: "Portuguese",
      nativeName: "Português"
    },
    it: {

      name: "Italian",
      nativeName: "Italiano"
    },
    nl: {

      name: "Dutch",
      nativeName: "Nederlands"
    },
    pl: {

      name: "Polish",
      nativeName: "Polski"
    },
    tr: {

      name: "Turkish",
      nativeName: "Türkçe"
    },
    ru: {

      name: "Russian",
      nativeName: "Русский"
    },
    uk: {

      name: "Ukrainian",
      nativeName: "Українська"
    },
    ar: {

      name: "Arabic",
      nativeName: "العربية"
    },
    he: {

      name: "Hebrew",
      nativeName: "עברית"
    },
    fa: {

      name: "Persian",
      nativeName: "فارسی"
    },
    hi: {

      name: "Hindi",
      nativeName: "हिन्दी"
    },
    bn: {

      name: "Bengali",
      nativeName: "বাংলা"
    },
    ur: {

      name: "Urdu",
      nativeName: "اردو"
    },
    id: {

      name: "Indonesian",
      nativeName: "Bahasa Indonesia"
    },
    ms: {

      name: "Malay",
      nativeName: "Bahasa Melayu"
    },
    vi: {

      name: "Vietnamese",
      nativeName: "Tiếng Việt"
    },
    th: {

      name: "Thai",
      nativeName: "ไทย"
    },
    zh: {

      name: "Chinese",
      nativeName: "中文"
    },
    ja: {

      name: "Japanese",
      nativeName: "日本語"
    },
    ko: {

      name: "Korean",
      nativeName: "한국어"
    },
    sw: {

      name: "Swahili",
      nativeName: "Kiswahili"
    },
    yo: {

      name: "Yoruba",
      nativeName: "Yorùbá"
    },
    ig: {

      name: "Igbo",
      nativeName: "Igbo"
    },
    ha: {

      name: "Hausa",
      nativeName: "Hausa"
    }
  };

  /*
   * =========================================
   * MIIMIID UI LOCALIZATION
   * =========================================
   */

  const MIIMIID_TRANSLATIONS = {    en: {
      untitledLesson: 'Untitled Lesson',
      noLessonContent: 'No lesson content available.',
      questionUnavailable: 'Question unavailable.',
      unsupportedQuestionType: 'Unsupported question type:',

      untitledLesson: 'Untitled Lesson',

      checking: 'Checking...',
      saving: 'Saving...',
      noQuizAvailable: 'There is no quiz available for this lesson.',
      answerAllQuestions: 'Please answer all the questions before submitting.',
      noLessonSelected: 'No lesson is currently selected.',
      submitQuizFirst: 'Please complete and submit the quiz before completing this lesson.',
      lessonNotFound: 'Lesson not found.',
      quizComplete: 'Quiz complete!',
      score: 'Score',
      youGot: 'You got',
      outOf: 'out of',
      correct: 'correct.',
      canCompleteLesson: 'You can now complete the lesson.',
      reviewLessonTryAgain: "Review the lesson and try again.",

      selectCourse: "Select a course to explore modules and lessons:",
      backToCourses: "← Back to Courses",
      backToModules: "← Back to Course Modules",
      yourProgress: "Your Progress",
      lessonsComplete: "lessons complete",
      noLessonsYet: "No lessons yet",
      startLesson: "Start Lesson",
      reviewLesson: "Review Lesson",
      completed: "✓ Completed",
      moduleComplete: "✓ Module complete",
      quickCheck: "Quick Check",
      submitAnswer: "Submit Answer",
      nextLesson: "Next Lesson",
      previousLesson: "Previous Lesson",
      loading: "Loading...",
      noDescription: "No description available.",
      noModules: "No modules are available yet.",
      noLessons: "No lessons available in this module yet.",
      lessonCompletedSuccessfully: "Lesson completed successfully! 🎉",
      selectLanguage: "Select language",
      openCourse: "Open Course",
      unableToLoadCourses: "Unable to load courses.",
      unableToLoadCourse: "Unable to load course.",
      invalidCourseId: "Invalid course ID.",
      questionInstruction: "Answer the questions below before completing the lesson.",
      unableToValidateQuiz: "Unable to validate quiz.",
      unableToConnect: 'Unable to connect to the server.',
      failedToSaveProgress: "Failed to save progress.",
      completeLesson: "Complete Lesson",
      somethingWentWrong: "Something went wrong."

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

      authWelcome: 'Welcome back',
      authSignInSubtitle: 'Sign in to continue to your account.',
      authCreateAccount: 'Create an account',
      authCreateSubtitle: 'Create your Miimiid account to get started.',
      authResetPassword: 'Reset your password',
      authResetSubtitle: 'Choose a new password for your Miimiid account.',
      authResetTitle: 'Reset your password',
      authResetDescription: 'Choose a new password for your Miimiid account.',
      authEmailOrPhone: 'Email or phone number',
      authPassword: 'Password',
      authSignIn: 'Sign In',
      authForgotPassword: 'Forgot password?',
      authCreateAccountLink: 'Create an account',
      authBackToSignIn: 'Back to sign in',
      authShowPassword: 'Show password',
      authHidePassword: 'Hide password',
      authNewPassword: 'New password',
      authConfirmNewPassword: 'Confirm new password',
      authConfirmPassword: 'Confirm password',
      authName: 'Name',
      authEmail: 'Email',
      authPhoneNumber: 'Phone number',
      authCreateAccountButton: 'Create Account',
      authSendResetInstructions: 'Send Reset Instructions',
      authResetPasswordButton: 'Reset Password',
      authPasswordsDoNotMatch: 'Passwords do not match.',
      authCreatingAccount: 'Creating your account...',
      authAccountCreated: 'Account created successfully.',
      authUnableToSignIn: 'Unable to sign in.',
      authUnableToCreateAccount: 'Unable to create your account.',

    },

    es: {
      noLessonContent: 'No hay contenido disponible para esta lección.',
      questionUnavailable: 'Pregunta no disponible.',
      unsupportedQuestionType: 'Tipo de pregunta no compatible:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Abrir curso',
      unableToLoadCourses: 'No se pudieron cargar los cursos.',
      invalidCourseId: 'ID de curso no válido.',
      questionInstruction: 'Responde las preguntas siguientes antes de completar la lección.',
      unableToConnect: 'No se pudo conectar con el servidor.',
      completeLesson: 'Completar lección',
      somethingWentWrong: 'Algo salió mal.',
      checking: 'Comprobando...',
      saving: 'Guardando...',
      noQuizAvailable: 'No hay ningún cuestionario disponible para esta lección.',
      answerAllQuestions: 'Responde todas las preguntas antes de enviar.',
      noLessonSelected: 'No hay ninguna lección seleccionada.',
      submitQuizFirst: 'Completa y envía el cuestionario antes de completar esta lección.',
      lessonNotFound: 'No se encontró la lección.',
      quizComplete: '¡Cuestionario completado!',
      score: 'Puntuación',
      youGot: 'Obtuviste',
      outOf: 'de',
      canCompleteLesson: 'Ahora puedes completar la lección.',
      reviewLessonTryAgain: 'Repasa la lección e inténtalo de nuevo.',

      selectCourse: "Selecciona un curso para explorar módulos y lecciones:",
      backToCourses: "← Volver a los cursos",
      backToModules: "← Volver a los módulos del curso",
      yourProgress: "Tu progreso",
      lessonsComplete: "lecciones completadas",
      noLessonsYet: "Aún no hay lecciones",
      startLesson: "Comenzar lección",
      reviewLesson: "Repasar lección",
      completed: "✓ Completada",
      moduleComplete: "✓ Módulo completado",
      quickCheck: "Comprobación rápida",
      submitAnswer: "Enviar respuesta",
      nextLesson: "Siguiente lección",
      previousLesson: "Lección anterior",
      loading: "Cargando...",
      noDescription: "No hay descripción disponible.",
      noModules: "Aún no hay módulos disponibles.",
      noLessons: "Aún no hay lecciones disponibles en este módulo.",
      unableToLoadCourse: "No se pudo cargar el curso.",
      unableToValidateQuiz: "No se pudo validar el cuestionario.",
      lessonCompleted: "¡Lección completada correctamente! 🎉",
      lessonCompletedSuccessfully: "¡Lección completada correctamente! 🎉",
      failedToSaveProgress: "No se pudo guardar el progreso.",
      selectLanguage: "Seleccionar idioma"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    fr: {
      noLessonContent: 'Aucun contenu n’est disponible pour cette leçon.',
      questionUnavailable: 'Question indisponible.',
      unsupportedQuestionType: 'Type de question non pris en charge :',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Ouvrir le cours',
      unableToLoadCourses: 'Impossible de charger les cours.',
      invalidCourseId: 'ID de cours invalide.',
      questionInstruction: 'Répondez aux questions ci-dessous avant de terminer la leçon.',
      unableToConnect: 'Impossible de se connecter au serveur.',
      completeLesson: 'Terminer la leçon',
      somethingWentWrong: "Une erreur s'est produite.",
      checking: 'Vérification...',
      saving: 'Enregistrement...',
      noQuizAvailable: "Aucun quiz n'est disponible pour cette leçon.",
      answerAllQuestions: "Répondez à toutes les questions avant d'envoyer vos réponses.",
      noLessonSelected: "Aucune leçon n'est actuellement sélectionnée.",
      submitQuizFirst: 'Terminez et envoyez le quiz avant de terminer cette leçon.',
      lessonNotFound: 'Leçon introuvable.',
      quizComplete: 'Quiz terminé !',
      score: 'Score',
      youGot: 'Vous avez obtenu',
      outOf: 'sur',
      correct: 'bonnes réponses.',
      canCompleteLesson: 'Vous pouvez maintenant terminer la leçon.',
      reviewLessonTryAgain: 'Revoyez la leçon et réessayez.',

      selectCourse: "Sélectionnez un cours pour explorer les modules et les leçons :",
      backToCourses: "← Retour aux cours",
      backToModules: "← Retour aux modules du cours",
      yourProgress: "Votre progression",
      lessonsComplete: "leçons terminées",
      noLessonsYet: "Aucune leçon pour le moment",
      startLesson: "Commencer la leçon",
      reviewLesson: "Revoir la leçon",
      completed: "✓ Terminée",
      moduleComplete: "✓ Module terminé",
      quickCheck: "Vérification rapide",
      submitAnswer: "Soumettre la réponse",
      nextLesson: "Leçon suivante",
      previousLesson: "Leçon précédente",
      loading: "Chargement...",
      noDescription: "Aucune description disponible.",
      noModules: "Aucun module n'est encore disponible.",
      noLessons: "Aucune leçon n'est encore disponible dans ce module.",
      unableToLoadCourse: "Impossible de charger le cours.",
      unableToValidateQuiz: "Impossible de valider le quiz.",
      lessonCompleted: "Leçon terminée avec succès ! 🎉",
      lessonCompletedSuccessfully: "Leçon terminée avec succès ! 🎉",
      failedToSaveProgress: "Échec de l'enregistrement de la progression.",
      selectLanguage: "Choisir la langue"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    de: {
      noLessonContent: 'Für diese Lektion ist kein Inhalt verfügbar.',
      questionUnavailable: 'Frage nicht verfügbar.',
      unsupportedQuestionType: 'Nicht unterstützter Fragetyp:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Kurs öffnen',
      unableToLoadCourses: 'Kurse konnten nicht geladen werden.',
      invalidCourseId: 'Ungültige Kurs-ID.',
      questionInstruction: 'Beantworte die folgenden Fragen, bevor du die Lektion abschließt.',
      unableToConnect: 'Verbindung zum Server konnte nicht hergestellt werden.',
      completeLesson: 'Lektion abschließen',
      somethingWentWrong: 'Etwas ist schiefgelaufen.',
      checking: 'Wird überprüft...',
      saving: 'Wird gespeichert...',
      noQuizAvailable: 'Für diese Lektion ist kein Quiz verfügbar.',
      answerAllQuestions: 'Beantworte alle Fragen, bevor du sie absendest.',
      noLessonSelected: 'Keine Lektion ist derzeit ausgewählt.',
      submitQuizFirst: 'Schließe das Quiz ab und sende es ab, bevor du diese Lektion abschließt.',
      lessonNotFound: 'Lektion nicht gefunden.',
      quizComplete: 'Quiz abgeschlossen!',
      score: 'Punktzahl',
      youGot: 'Du hast',
      outOf: 'von',
      correct: 'richtig beantwortet.',
      canCompleteLesson: 'Du kannst die Lektion jetzt abschließen.',
      reviewLessonTryAgain: 'Wiederhole die Lektion und versuche es erneut.',

      selectCourse: "Wähle einen Kurs aus, um Module und Lektionen zu entdecken:",
      backToCourses: "← Zurück zu den Kursen",
      backToModules: "← Zurück zu den Kursmodulen",
      yourProgress: "Dein Fortschritt",
      lessonsComplete: "Lektionen abgeschlossen",
      noLessonsYet: "Noch keine Lektionen",
      startLesson: "Lektion starten",
      reviewLesson: "Lektion wiederholen",
      completed: "✓ Abgeschlossen",
      moduleComplete: "✓ Modul abgeschlossen",
      quickCheck: "Schnelltest",
      submitAnswer: "Antwort senden",
      nextLesson: "Nächste Lektion",
      previousLesson: "Vorherige Lektion",
      loading: "Wird geladen...",
      noDescription: "Keine Beschreibung verfügbar.",
      noModules: "Noch keine Module verfügbar.",
      noLessons: "In diesem Modul sind noch keine Lektionen verfügbar.",
      unableToLoadCourse: "Der Kurs konnte nicht geladen werden.",
      unableToValidateQuiz: "Das Quiz konnte nicht validiert werden.",
      lessonCompleted: "Lektion erfolgreich abgeschlossen! 🎉",
      lessonCompletedSuccessfully: "Lektion erfolgreich abgeschlossen! 🎉",
      failedToSaveProgress: "Der Fortschritt konnte nicht gespeichert werden.",
      selectLanguage: "Sprache auswählen"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    pt: {
      noLessonContent: 'Não há conteúdo disponível para esta lição.',
      questionUnavailable: 'Pergunta indisponível.',
      unsupportedQuestionType: 'Tipo de pergunta não compatível:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Abrir curso',
      unableToLoadCourses: 'Não foi possível carregar os cursos.',
      invalidCourseId: 'ID do curso inválido.',
      questionInstruction: 'Responda às perguntas abaixo antes de concluir a lição.',
      unableToConnect: 'Não foi possível conectar ao servidor.',
      completeLesson: 'Concluir lição',
      somethingWentWrong: 'Algo deu errado.',
      checking: 'Verificando...',
      saving: 'Salvando...',
      noQuizAvailable: 'Não há questionário disponível para esta lição.',
      answerAllQuestions: 'Responda a todas as perguntas antes de enviar.',
      noLessonSelected: 'Nenhuma lição está selecionada.',
      submitQuizFirst: 'Conclua e envie o questionário antes de concluir esta lição.',
      lessonNotFound: 'Lição não encontrada.',
      quizComplete: 'Questionário concluído!',
      score: 'Pontuação',
      youGot: 'Você acertou',
      outOf: 'de',
      correct: 'corretas.',
      canCompleteLesson: 'Agora você pode concluir a lição.',
      reviewLessonTryAgain: 'Revise a lição e tente novamente.',

      selectCourse: "Selecione um curso para explorar módulos e lições:",
      backToCourses: "← Voltar aos cursos",
      backToModules: "← Voltar aos módulos do curso",
      yourProgress: "Seu progresso",
      lessonsComplete: "lições concluídas",
      noLessonsYet: "Nenhuma lição ainda",
      startLesson: "Iniciar lição",
      reviewLesson: "Revisar lição",
      completed: "✓ Concluída",
      moduleComplete: "✓ Módulo concluído",
      quickCheck: "Verificação rápida",
      submitAnswer: "Enviar resposta",
      nextLesson: "Próxima lição",
      previousLesson: "Lição anterior",
      loading: "Carregando...",
      noDescription: "Nenhuma descrição disponível.",
      noModules: "Nenhum módulo disponível ainda.",
      noLessons: "Nenhuma lição disponível neste módulo ainda.",
      unableToLoadCourse: "Não foi possível carregar o curso.",
      unableToValidateQuiz: "Não foi possível validar o questionário.",
      lessonCompleted: "Lição concluída com sucesso! 🎉",
      lessonCompletedSuccessfully: "Lição concluída com sucesso! 🎉",
      failedToSaveProgress: "Não foi possível guardar o progresso.",
      selectLanguage: "Selecionar idioma"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    it: {
      noLessonContent: 'Nessun contenuto disponibile per questa lezione.',
      questionUnavailable: 'Domanda non disponibile.',
      unsupportedQuestionType: 'Tipo di domanda non supportato:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Apri corso',
      unableToLoadCourses: 'Impossibile caricare i corsi.',
      invalidCourseId: 'ID corso non valido.',
      questionInstruction: 'Rispondi alle domande qui sotto prima di completare la lezione.',
      unableToConnect: 'Impossibile connettersi al server.',
      completeLesson: 'Completa lezione',
      somethingWentWrong: 'Qualcosa è andato storto.',
      checking: 'Controllo...',
      saving: 'Salvataggio...',
      noQuizAvailable: 'Non ci sono quiz disponibili per questa lezione.',
      answerAllQuestions: 'Rispondi a tutte le domande prima di inviare.',
      noLessonSelected: 'Nessuna lezione è attualmente selezionata.',
      submitQuizFirst: 'Completa e invia il quiz prima di completare questa lezione.',
      lessonNotFound: 'Lezione non trovata.',
      quizComplete: 'Quiz completato!',
      score: 'Punteggio',
      youGot: 'Hai ottenuto',
      outOf: 'su',
      correct: 'risposte corrette.',
      canCompleteLesson: 'Ora puoi completare la lezione.',
      reviewLessonTryAgain: 'Ripassa la lezione e riprova.',

      selectCourse: "Seleziona un corso per esplorare moduli e lezioni:",
      backToCourses: "← Torna ai corsi",
      backToModules: "← Torna ai moduli del corso",
      yourProgress: "I tuoi progressi",
      lessonsComplete: "lezioni completate",
      noLessonsYet: "Nessuna lezione ancora",
      startLesson: "Inizia lezione",
      reviewLesson: "Ripassa lezione",
      completed: "✓ Completata",
      moduleComplete: "✓ Modulo completato",
      quickCheck: "Controllo rapido",
      submitAnswer: "Invia risposta",
      nextLesson: "Lezione successiva",
      previousLesson: "Lezione precedente",
      loading: "Caricamento...",
      noDescription: "Nessuna descrizione disponibile.",
      noModules: "Nessun modulo disponibile.",
      noLessons: "Nessuna lezione disponibile in questo modulo.",
      unableToLoadCourse: "Impossibile caricare il corso.",
      unableToValidateQuiz: "Impossibile convalidare il quiz.",
      lessonCompleted: "Lezione completata con successo! 🎉",
      lessonCompletedSuccessfully: "Lezione completata con successo! 🎉",
      failedToSaveProgress: "Impossibile salvare i progressi.",
      selectLanguage: "Seleziona lingua"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    nl: {
      noLessonContent: 'Er is geen inhoud beschikbaar voor deze les.',
      questionUnavailable: 'Vraag niet beschikbaar.',
      unsupportedQuestionType: 'Niet-ondersteund vraagtype:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Cursus openen',
      unableToLoadCourses: 'Kan cursussen niet laden.',
      invalidCourseId: 'Ongeldige cursus-ID.',
      questionInstruction: 'Beantwoord de onderstaande vragen voordat je de les voltooit.',
      unableToConnect: 'Kan geen verbinding maken met de server.',
      completeLesson: 'Les voltooien',
      somethingWentWrong: 'Er is iets misgegaan.',
      checking: 'Controleren...',
      saving: 'Opslaan...',
      noQuizAvailable: 'Er is geen quiz beschikbaar voor deze les.',
      answerAllQuestions: 'Beantwoord alle vragen voordat je ze indient.',
      noLessonSelected: 'Er is momenteel geen les geselecteerd.',
      submitQuizFirst: 'Voltooi en dien de quiz in voordat je deze les voltooit.',
      lessonNotFound: 'Les niet gevonden.',
      quizComplete: 'Quiz voltooid!',
      score: 'Score',
      youGot: 'Je hebt',
      outOf: 'van de',
      correct: 'goed.',
      canCompleteLesson: 'Je kunt de les nu voltooien.',
      reviewLessonTryAgain: 'Bekijk de les opnieuw en probeer het nog eens.',

      selectCourse: "Selecteer een cursus om modules en lessen te bekijken:",
      backToCourses: "← Terug naar cursussen",
      backToModules: "← Terug naar cursusmodules",
      yourProgress: "Jouw voortgang",
      lessonsComplete: "lessen voltooid",
      noLessonsYet: "Nog geen lessen",
      startLesson: "Les starten",
      reviewLesson: "Les herhalen",
      completed: "✓ Voltooid",
      moduleComplete: "✓ Module voltooid",
      quickCheck: "Snelle controle",
      submitAnswer: "Antwoord indienen",
      nextLesson: "Volgende les",
      previousLesson: "Vorige les",
      loading: "Laden...",
      noDescription: "Geen beschrijving beschikbaar.",
      noModules: "Er zijn nog geen modules beschikbaar.",
      noLessons: "Er zijn nog geen lessen beschikbaar in deze module.",
      unableToLoadCourse: "Kan de cursus niet laden.",
      unableToValidateQuiz: "Kan de quiz niet valideren.",
      lessonCompleted: "Les succesvol voltooid! 🎉",
      lessonCompletedSuccessfully: "Les succesvol voltooid! 🎉",
      failedToSaveProgress: "De voortgang kon niet worden opgeslagen.",
      selectLanguage: "Taal selecteren"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    pl: {
      noLessonContent: 'Brak dostępnej treści dla tej lekcji.',
      questionUnavailable: 'Pytanie niedostępne.',
      unsupportedQuestionType: 'Nieobsługiwany typ pytania:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Otwórz kurs',
      unableToLoadCourses: 'Nie udało się załadować kursów.',
      invalidCourseId: 'Nieprawidłowy identyfikator kursu.',
      questionInstruction: 'Odpowiedz na poniższe pytania przed ukończeniem lekcji.',
      unableToConnect: 'Nie można połączyć się z serwerem.',
      completeLesson: 'Ukończ lekcję',
      somethingWentWrong: 'Coś poszło nie tak.',
      checking: 'Sprawdzanie...',
      saving: 'Zapisywanie...',
      noQuizAvailable: 'Dla tej lekcji nie ma dostępnego quizu.',
      answerAllQuestions: 'Odpowiedz na wszystkie pytania przed wysłaniem.',
      noLessonSelected: 'Nie wybrano aktualnie żadnej lekcji.',
      submitQuizFirst: 'Ukończ i wyślij quiz przed ukończeniem tej lekcji.',
      lessonNotFound: 'Nie znaleziono lekcji.',
      quizComplete: 'Quiz ukończony!',
      score: 'Wynik',
      youGot: 'Uzyskano',
      outOf: 'z',
      correct: 'poprawnych odpowiedzi.',
      canCompleteLesson: 'Możesz teraz ukończyć lekcję.',
      reviewLessonTryAgain: 'Powtórz lekcję i spróbuj ponownie.',

      selectCourse: "Wybierz kurs, aby poznać moduły i lekcje:",
      backToCourses: "← Powrót do kursów",
      backToModules: "← Powrót do modułów kursu",
      yourProgress: "Twój postęp",
      lessonsComplete: "ukończonych lekcji",
      noLessonsYet: "Brak lekcji",
      startLesson: "Rozpocznij lekcję",
      reviewLesson: "Powtórz lekcję",
      completed: "✓ Ukończono",
      moduleComplete: "✓ Moduł ukończony",
      quickCheck: "Szybkie sprawdzenie",
      submitAnswer: "Wyślij odpowiedź",
      nextLesson: "Następna lekcja",
      previousLesson: "Poprzednia lekcja",
      loading: "Ładowanie...",
      noDescription: "Brak dostępnego opisu.",
      noModules: "Brak dostępnych modułów.",
      noLessons: "W tym module nie ma jeszcze dostępnych lekcji.",
      unableToLoadCourse: "Nie udało się załadować kursu.",
      unableToValidateQuiz: "Nie udało się zweryfikować quizu.",
      lessonCompleted: "Lekcja ukończona pomyślnie! 🎉",
      lessonCompletedSuccessfully: "Lekcja ukończona pomyślnie! 🎉",
      failedToSaveProgress: "Nie udało się zapisać postępów.",
      selectLanguage: "Wybierz język"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    tr: {
      noLessonContent: 'Bu ders için içerik mevcut değil.',
      questionUnavailable: 'Soru mevcut değil.',
      unsupportedQuestionType: 'Desteklenmeyen soru türü:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Kursu Aç',
      unableToLoadCourses: 'Kurslar yüklenemedi.',
      invalidCourseId: 'Geçersiz kurs kimliği.',
      questionInstruction: 'Dersi tamamlamadan önce aşağıdaki soruları cevaplayın.',
      unableToConnect: 'Sunucuya bağlanılamadı.',
      completeLesson: 'Dersi Tamamla',
      somethingWentWrong: 'Bir şeyler yanlış gitti.',
      checking: 'Kontrol ediliyor...',
      saving: 'Kaydediliyor...',
      noQuizAvailable: 'Bu ders için kullanılabilir bir test yok.',
      answerAllQuestions: 'Göndermeden önce tüm soruları cevaplayın.',
      noLessonSelected: 'Şu anda seçili bir ders yok.',
      submitQuizFirst: 'Bu dersi tamamlamadan önce testi tamamlayıp gönderin.',
      lessonNotFound: 'Ders bulunamadı.',
      quizComplete: 'Test tamamlandı!',
      score: 'Puan',
      youGot: 'Doğru cevap',
      outOf: '/',
      correct: 'doğru.',
      canCompleteLesson: 'Artık dersi tamamlayabilirsiniz.',
      reviewLessonTryAgain: 'Dersi gözden geçirip tekrar deneyin.',

      selectCourse: "Modülleri ve dersleri keşfetmek için bir kurs seçin:",
      backToCourses: "← Kurslara dön",
      backToModules: "← Kurs modüllerine dön",
      yourProgress: "İlerlemeniz",
      lessonsComplete: "ders tamamlandı",
      noLessonsYet: "Henüz ders yok",
      startLesson: "Derse Başla",
      reviewLesson: "Dersi Tekrarla",
      completed: "✓ Tamamlandı",
      moduleComplete: "✓ Modül tamamlandı",
      quickCheck: "Hızlı Kontrol",
      submitAnswer: "Cevabı Gönder",
      nextLesson: "Sonraki Ders",
      previousLesson: "Önceki Ders",
      loading: "Yükleniyor...",
      noDescription: "Açıklama mevcut değil.",
      noModules: "Henüz kullanılabilir modül yok.",
      noLessons: "Bu modülde henüz kullanılabilir ders yok.",
      unableToLoadCourse: "Kurs yüklenemedi.",
      unableToValidateQuiz: "Test doğrulanamadı.",
      lessonCompleted: "Ders başarıyla tamamlandı! 🎉",
      lessonCompletedSuccessfully: "Ders başarıyla tamamlandı! 🎉",
      failedToSaveProgress: "İlerleme kaydedilemedi.",
      selectLanguage: "Dil seçin"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ru: {
      noLessonContent: 'Для этого урока нет доступного содержимого.',
      questionUnavailable: 'Вопрос недоступен.',
      unsupportedQuestionType: 'Неподдерживаемый тип вопроса:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Открыть курс',
      unableToLoadCourses: 'Не удалось загрузить курсы.',
      invalidCourseId: 'Недопустимый идентификатор курса.',
      questionInstruction: 'Ответьте на вопросы ниже перед завершением урока.',
      unableToConnect: 'Не удалось подключиться к серверу.',
      completeLesson: 'Завершить урок',
      somethingWentWrong: 'Что-то пошло не так.',
      checking: 'Проверка...',
      saving: 'Сохранение...',
      noQuizAvailable: 'Для этого урока нет доступного теста.',
      answerAllQuestions: 'Ответьте на все вопросы перед отправкой.',
      noLessonSelected: 'Урок не выбран.',
      submitQuizFirst: 'Пройдите и отправьте тест перед завершением этого урока.',
      lessonNotFound: 'Урок не найден.',
      quizComplete: 'Тест завершён!',
      score: 'Результат',
      youGot: 'Правильных ответов',
      outOf: 'из',
      correct: 'правильных.',
      canCompleteLesson: 'Теперь можно завершить урок.',
      reviewLessonTryAgain: 'Повторите урок и попробуйте снова.',

      selectCourse: "Выберите курс, чтобы изучить модули и уроки:",
      backToCourses: "← Назад к курсам",
      backToModules: "← Назад к модулям курса",
      yourProgress: "Ваш прогресс",
      lessonsComplete: "уроков завершено",
      noLessonsYet: "Уроков пока нет",
      startLesson: "Начать урок",
      reviewLesson: "Повторить урок",
      completed: "✓ Завершено",
      moduleComplete: "✓ Модуль завершён",
      quickCheck: "Быстрая проверка",
      submitAnswer: "Отправить ответ",
      nextLesson: "Следующий урок",
      previousLesson: "Предыдущий урок",
      loading: "Загрузка...",
      noDescription: "Описание недоступно.",
      noModules: "Модули пока недоступны.",
      noLessons: "В этом модуле пока нет доступных уроков.",
      unableToLoadCourse: "Не удалось загрузить курс.",
      unableToValidateQuiz: "Не удалось проверить тест.",
      lessonCompleted: "Урок успешно завершён! 🎉",
      lessonCompletedSuccessfully: "Урок успешно завершён! 🎉",
      failedToSaveProgress: "Не удалось сохранить прогресс.",
      selectLanguage: "Выберите язык"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    uk: {
      noLessonContent: 'Для цього уроку немає доступного вмісту.',
      questionUnavailable: 'Запитання недоступне.',
      unsupportedQuestionType: 'Непідтримуваний тип запитання:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Відкрити курс',
      unableToLoadCourses: 'Не вдалося завантажити курси.',
      invalidCourseId: 'Недійсний ідентифікатор курсу.',
      questionInstruction: 'Дайте відповіді на наведені нижче запитання перед завершенням уроку.',
      unableToConnect: 'Не вдалося підключитися до сервера.',
      completeLesson: 'Завершити урок',
      somethingWentWrong: 'Щось пішло не так.',
      checking: 'Перевірка...',
      saving: 'Збереження...',
      noQuizAvailable: 'Для цього уроку немає доступного тесту.',
      answerAllQuestions: 'Дайте відповіді на всі запитання перед надсиланням.',
      noLessonSelected: 'Урок не вибрано.',
      submitQuizFirst: 'Пройдіть і надішліть тест перед завершенням цього уроку.',
      lessonNotFound: 'Урок не знайдено.',
      quizComplete: 'Тест завершено!',
      score: 'Результат',
      youGot: 'Правильних відповідей',
      outOf: 'із',
      correct: 'правильних.',
      canCompleteLesson: 'Тепер ви можете завершити урок.',
      reviewLessonTryAgain: 'Перегляньте урок і спробуйте ще раз.',

      selectCourse: "Виберіть курс, щоб переглянути модулі та уроки:",
      backToCourses: "← Назад до курсів",
      backToModules: "← Назад до модулів курсу",
      yourProgress: "Ваш прогрес",
      lessonsComplete: "уроків завершено",
      noLessonsYet: "Уроків ще немає",
      startLesson: "Почати урок",
      reviewLesson: "Повторити урок",
      completed: "✓ Завершено",
      moduleComplete: "✓ Модуль завершено",
      quickCheck: "Швидка перевірка",
      submitAnswer: "Надіслати відповідь",
      nextLesson: "Наступний урок",
      previousLesson: "Попередній урок",
      loading: "Завантаження...",
      noDescription: "Опис недоступний.",
      noModules: "Модулі ще недоступні.",
      noLessons: "У цьому модулі ще немає доступних уроків.",
      unableToLoadCourse: "Не вдалося завантажити курс.",
      unableToValidateQuiz: "Не вдалося перевірити тест.",
      lessonCompleted: "Урок успішно завершено! 🎉",
      lessonCompletedSuccessfully: "Урок успішно завершено! 🎉",
      failedToSaveProgress: "Не вдалося зберегти прогрес.",
      selectLanguage: "Виберіть мову"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ar: {
      noLessonContent: 'لا يوجد محتوى متاح لهذا الدرس.',
      questionUnavailable: 'السؤال غير متاح.',
      unsupportedQuestionType: 'نوع السؤال غير مدعوم:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'فتح الدورة',
      unableToLoadCourses: 'تعذر تحميل الدورات.',
      invalidCourseId: 'معرّف الدورة غير صالح.',
      questionInstruction: 'أجب عن الأسئلة أدناه قبل إكمال الدرس.',
      unableToConnect: 'تعذر الاتصال بالخادم.',
      completeLesson: 'إكمال الدرس',
      somethingWentWrong: 'حدث خطأ ما.',
      checking: 'جارٍ التحقق...',
      saving: 'جارٍ الحفظ...',
      noQuizAvailable: 'لا يوجد اختبار متاح لهذا الدرس.',
      answerAllQuestions: 'أجب عن جميع الأسئلة قبل الإرسال.',
      noLessonSelected: 'لم يتم تحديد درس حاليًا.',
      submitQuizFirst: 'أكمل الاختبار وأرسله قبل إكمال هذا الدرس.',
      lessonNotFound: 'لم يتم العثور على الدرس.',
      quizComplete: 'اكتمل الاختبار!',
      score: 'النتيجة',
      youGot: 'أجبت بشكل صحيح عن',
      outOf: 'من',
      correct: 'إجابات صحيحة.',
      canCompleteLesson: 'يمكنك الآن إكمال الدرس.',
      reviewLessonTryAgain: 'راجع الدرس وحاول مرة أخرى.',

      selectCourse: "اختر دورة لاستكشاف الوحدات والدروس:",
      backToCourses: "← العودة إلى الدورات",
      backToModules: "← العودة إلى وحدات الدورة",
      yourProgress: "تقدمك",
      lessonsComplete: "دروس مكتملة",
      noLessonsYet: "لا توجد دروس بعد",
      startLesson: "ابدأ الدرس",
      reviewLesson: "مراجعة الدرس",
      completed: "✓ مكتمل",
      moduleComplete: "✓ اكتملت الوحدة",
      quickCheck: "اختبار سريع",
      submitAnswer: "إرسال الإجابة",
      nextLesson: "الدرس التالي",
      previousLesson: "الدرس السابق",
      loading: "جارٍ التحميل...",
      noDescription: "لا يوجد وصف متاح.",
      noModules: "لا توجد وحدات متاحة بعد.",
      noLessons: "لا توجد دروس متاحة في هذه الوحدة بعد.",
      unableToLoadCourse: "تعذر تحميل الدورة.",
      unableToValidateQuiz: "تعذر التحقق من الاختبار.",
      lessonCompleted: "اكتمل الدرس بنجاح! 🎉",
      lessonCompletedSuccessfully: "اكتمل الدرس بنجاح! 🎉",
      failedToSaveProgress: "تعذر حفظ التقدم.",
      selectLanguage: "اختيار اللغة"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    he: {
      noLessonContent: 'אין תוכן זמין לשיעור זה.',
      questionUnavailable: 'השאלה אינה זמינה.',
      unsupportedQuestionType: 'סוג שאלה שאינו נתמך:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'פתיחת קורס',
      unableToLoadCourses: 'לא ניתן לטעון את הקורסים.',
      invalidCourseId: 'מזהה קורס לא חוקי.',
      questionInstruction: 'ענה על השאלות שלהלן לפני השלמת השיעור.',
      unableToConnect: 'לא ניתן להתחבר לשרת.',
      completeLesson: 'השלמת שיעור',
      somethingWentWrong: 'משהו השתבש.',
      checking: 'בודק...',
      saving: 'שומר...',
      noQuizAvailable: 'אין שאלון זמין לשיעור זה.',
      answerAllQuestions: 'ענה על כל השאלות לפני השליחה.',
      noLessonSelected: 'לא נבחר שיעור כרגע.',
      submitQuizFirst: 'השלם ושלח את השאלון לפני השלמת השיעור.',
      lessonNotFound: 'השיעור לא נמצא.',
      quizComplete: 'השאלון הושלם!',
      score: 'ציון',
      youGot: 'ענית נכון על',
      outOf: 'מתוך',
      correct: 'תשובות נכונות.',
      canCompleteLesson: 'כעת ניתן להשלים את השיעור.',
      reviewLessonTryAgain: 'חזור על השיעור ונסה שוב.',

      selectCourse: "בחר קורס כדי לחקור את המודולים והשיעורים:",
      backToCourses: "← חזרה לקורסים",
      backToModules: "← חזרה למודולי הקורס",
      yourProgress: "ההתקדמות שלך",
      lessonsComplete: "שיעורים שהושלמו",
      noLessonsYet: "אין עדיין שיעורים",
      startLesson: "התחל שיעור",
      reviewLesson: "חזור על השיעור",
      completed: "✓ הושלם",
      moduleComplete: "✓ המודול הושלם",
      quickCheck: "בדיקה מהירה",
      submitAnswer: "שלח תשובה",
      nextLesson: "השיעור הבא",
      previousLesson: "השיעור הקודם",
      loading: "טוען...",
      noDescription: "אין תיאור זמין.",
      noModules: "אין עדיין מודולים זמינים.",
      noLessons: "אין עדיין שיעורים זמינים במודול זה.",
      unableToLoadCourse: "לא ניתן לטעון את הקורס.",
      unableToValidateQuiz: "לא ניתן לאמת את השאלון.",
      lessonCompleted: "השיעור הושלם בהצלחה! 🎉",
      lessonCompletedSuccessfully: "השיעור הושלם בהצלחה! 🎉",
      failedToSaveProgress: "לא ניתן היה לשמור את ההתקדמות.",
      selectLanguage: "בחירת שפה"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    fa: {
      noLessonContent: 'محتوایی برای این درس در دسترس نیست.',
      questionUnavailable: 'پرسش در دسترس نیست.',
      unsupportedQuestionType: 'نوع پرسش پشتیبانی نمی‌شود:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'باز کردن دوره',
      unableToLoadCourses: 'بارگذاری دوره\u200cها ممکن نیست.',
      invalidCourseId: 'شناسه دوره نامعتبر است.',
      questionInstruction: 'پیش از تکمیل درس، به پرسش\u200cهای زیر پاسخ دهید.',
      unableToConnect: 'اتصال به سرور ممکن نیست.',
      completeLesson: 'تکمیل درس',
      somethingWentWrong: 'مشکلی پیش آمد.',
      checking: 'در حال بررسی...',
      saving: 'در حال ذخیره...',
      noQuizAvailable: 'برای این درس آزمونی در دسترس نیست.',
      answerAllQuestions: 'پیش از ارسال، به همه پرسش\u200cها پاسخ دهید.',
      noLessonSelected: 'در حال حاضر درسی انتخاب نشده است.',
      submitQuizFirst: 'پیش از تکمیل این درس، آزمون را کامل و ارسال کنید.',
      lessonNotFound: 'درس پیدا نشد.',
      quizComplete: 'آزمون تکمیل شد!',
      score: 'امتیاز',
      youGot: 'پاسخ صحیح شما',
      outOf: 'از',
      correct: 'پاسخ صحیح بود.',
      canCompleteLesson: 'اکنون می\u200cتوانید درس را تکمیل کنید.',
      reviewLessonTryAgain: 'درس را مرور کنید و دوباره تلاش کنید.',

      selectCourse: "یک دوره را برای مشاهده ماژول‌ها و درس‌ها انتخاب کنید:",
      backToCourses: "← بازگشت به دوره‌ها",
      backToModules: "← بازگشت به ماژول‌های دوره",
      yourProgress: "پیشرفت شما",
      lessonsComplete: "درس تکمیل شده",
      noLessonsYet: "هنوز درسی وجود ندارد",
      startLesson: "شروع درس",
      reviewLesson: "مرور درس",
      completed: "✓ تکمیل شد",
      moduleComplete: "✓ ماژول تکمیل شد",
      quickCheck: "بررسی سریع",
      submitAnswer: "ارسال پاسخ",
      nextLesson: "درس بعدی",
      previousLesson: "درس قبلی",
      loading: "در حال بارگذاری...",
      noDescription: "توضیحی موجود نیست.",
      noModules: "هنوز ماژولی در دسترس نیست.",
      noLessons: "هنوز درسی در این ماژول موجود نیست.",
      unableToLoadCourse: "بارگذاری دوره ممکن نیست.",
      unableToValidateQuiz: "اعتبارسنجی آزمون ممکن نیست.",
      lessonCompleted: "درس با موفقیت تکمیل شد! 🎉",
      lessonCompletedSuccessfully: "درس با موفقیت تکمیل شد! 🎉",
      failedToSaveProgress: "ذخیره پیشرفت امکان‌پذیر نبود.",
      selectLanguage: "انتخاب زبان"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    hi: {
      noLessonContent: 'इस पाठ के लिए कोई सामग्री उपलब्ध नहीं है।',
      questionUnavailable: 'प्रश्न उपलब्ध नहीं है।',
      unsupportedQuestionType: 'असमर्थित प्रश्न प्रकार:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'कोर्स खोलें',
      unableToLoadCourses: 'कोर्स लोड नहीं किए जा सके।',
      invalidCourseId: 'अमान्य कोर्स आईडी।',
      questionInstruction: 'पाठ पूरा करने से पहले नीचे दिए गए प्रश्नों के उत्तर दें।',
      unableToConnect: 'सर्वर से कनेक्ट नहीं हो सका।',
      completeLesson: 'पाठ पूरा करें',
      somethingWentWrong: 'कुछ गलत हो गया।',
      checking: 'जाँच हो रही है...',
      saving: 'सहेजा जा रहा है...',
      noQuizAvailable: 'इस पाठ के लिए कोई क्विज़ उपलब्ध नहीं है।',
      answerAllQuestions: 'जमा करने से पहले सभी प्रश्नों के उत्तर दें।',
      noLessonSelected: 'अभी कोई पाठ चयनित नहीं है।',
      submitQuizFirst: 'इस पाठ को पूरा करने से पहले क्विज़ पूरा करके जमा करें।',
      lessonNotFound: 'पाठ नहीं मिला।',
      quizComplete: 'क्विज़ पूरा हुआ!',
      score: 'स्कोर',
      youGot: 'आपने सही उत्तर दिए',
      outOf: 'में से',
      correct: 'सही।',
      canCompleteLesson: 'अब आप पाठ पूरा कर सकते हैं।',
      reviewLessonTryAgain: 'पाठ की समीक्षा करें और फिर प्रयास करें।',

      selectCourse: "मॉड्यूल और पाठ देखने के लिए एक कोर्स चुनें:",
      backToCourses: "← कोर्स पर वापस जाएँ",
      backToModules: "← कोर्स मॉड्यूल पर वापस जाएँ",
      yourProgress: "आपकी प्रगति",
      lessonsComplete: "पाठ पूरे हुए",
      noLessonsYet: "अभी कोई पाठ नहीं",
      startLesson: "पाठ शुरू करें",
      reviewLesson: "पाठ दोहराएँ",
      completed: "✓ पूरा हुआ",
      moduleComplete: "✓ मॉड्यूल पूरा हुआ",
      quickCheck: "त्वरित जाँच",
      submitAnswer: "उत्तर जमा करें",
      nextLesson: "अगला पाठ",
      previousLesson: "पिछला पाठ",
      loading: "लोड हो रहा है...",
      noDescription: "कोई विवरण उपलब्ध नहीं है।",
      noModules: "अभी कोई मॉड्यूल उपलब्ध नहीं है।",
      noLessons: "इस मॉड्यूल में अभी कोई पाठ उपलब्ध नहीं है।",
      unableToLoadCourse: "कोर्स लोड नहीं किया जा सका।",
      unableToValidateQuiz: "क्विज़ सत्यापित नहीं की जा सकी।",
      lessonCompleted: "पाठ सफलतापूर्वक पूरा हुआ! 🎉",
      lessonCompletedSuccessfully: "पाठ सफलतापूर्वक पूरा हुआ! 🎉",
      failedToSaveProgress: "प्रगति सहेजी नहीं जा सकी।",
      selectLanguage: "भाषा चुनें"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    bn: {
      noLessonContent: 'এই পাঠের জন্য কোনো বিষয়বস্তু উপলভ্য নেই।',
      questionUnavailable: 'প্রশ্নটি উপলভ্য নয়।',
      unsupportedQuestionType: 'অসমর্থিত প্রশ্নের ধরন:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'কোর্স খুলুন',
      unableToLoadCourses: 'কোর্সগুলো লোড করা যায়নি।',
      invalidCourseId: 'অবৈধ কোর্স আইডি।',
      questionInstruction: 'পাঠ সম্পন্ন করার আগে নিচের প্রশ্নগুলোর উত্তর দিন।',
      unableToConnect: 'সার্ভারের সাথে সংযোগ করা যায়নি।',
      completeLesson: 'পাঠ সম্পন্ন করুন',
      somethingWentWrong: 'কিছু ভুল হয়েছে।',
      checking: 'যাচাই করা হচ্ছে...',
      saving: 'সংরক্ষণ করা হচ্ছে...',
      noQuizAvailable: 'এই পাঠের জন্য কোনো কুইজ উপলভ্য নেই।',
      answerAllQuestions: 'জমা দেওয়ার আগে সব প্রশ্নের উত্তর দিন।',
      noLessonSelected: 'এখন কোনো পাঠ নির্বাচন করা হয়নি।',
      submitQuizFirst: 'এই পাঠ সম্পন্ন করার আগে কুইজটি সম্পন্ন করে জমা দিন।',
      lessonNotFound: 'পাঠ পাওয়া যায়নি।',
      quizComplete: 'কুইজ সম্পন্ন হয়েছে!',
      score: 'স্কোর',
      youGot: 'আপনি সঠিক উত্তর দিয়েছেন',
      outOf: 'এর মধ্যে',
      correct: 'টি।',
      canCompleteLesson: 'এখন আপনি পাঠটি সম্পন্ন করতে পারেন।',
      reviewLessonTryAgain: 'পাঠটি পর্যালোচনা করে আবার চেষ্টা করুন।',

      selectCourse: "মডিউল ও পাঠ দেখতে একটি কোর্স নির্বাচন করুন:",
      backToCourses: "← কোর্সে ফিরে যান",
      backToModules: "← কোর্সের মডিউলে ফিরে যান",
      yourProgress: "আপনার অগ্রগতি",
      lessonsComplete: "টি পাঠ সম্পন্ন",
      noLessonsYet: "এখনও কোনো পাঠ নেই",
      startLesson: "পাঠ শুরু করুন",
      reviewLesson: "পাঠ পুনরায় দেখুন",
      completed: "✓ সম্পন্ন",
      moduleComplete: "✓ মডিউল সম্পন্ন",
      quickCheck: "দ্রুত যাচাই",
      submitAnswer: "উত্তর জমা দিন",
      nextLesson: "পরবর্তী পাঠ",
      previousLesson: "আগের পাঠ",
      loading: "লোড হচ্ছে...",
      noDescription: "কোনো বিবরণ পাওয়া যায়নি।",
      noModules: "এখনও কোনো মডিউল উপলভ্য নেই।",
      noLessons: "এই মডিউলে এখনও কোনো পাঠ উপলভ্য নেই।",
      unableToLoadCourse: "কোর্স লোড করা যায়নি।",
      unableToValidateQuiz: "কুইজ যাচাই করা যায়নি।",
      lessonCompleted: "পাঠ সফলভাবে সম্পন্ন হয়েছে! 🎉",
      lessonCompletedSuccessfully: "পাঠ সফলভাবে সম্পন্ন হয়েছে! 🎉",
      failedToSaveProgress: "অগ্রগতি সংরক্ষণ করা যায়নি।",
      selectLanguage: "ভাষা নির্বাচন করুন"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ur: {
      noLessonContent: 'اس سبق کے لیے کوئی مواد دستیاب نہیں ہے۔',
      questionUnavailable: 'سوال دستیاب نہیں ہے۔',
      unsupportedQuestionType: 'غیر معاون سوال کی قسم:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'کورس کھولیں',
      unableToLoadCourses: 'کورسز لوڈ نہیں کیے جا سکے۔',
      invalidCourseId: 'غلط کورس آئی ڈی۔',
      questionInstruction: 'سبق مکمل کرنے سے پہلے نیچے دیے گئے سوالات کے جواب دیں۔',
      unableToConnect: 'سرور سے رابطہ نہیں ہو سکا۔',
      completeLesson: 'سبق مکمل کریں',
      somethingWentWrong: 'کچھ غلط ہو گیا۔',
      checking: 'جانچ ہو رہی ہے...',
      saving: 'محفوظ کیا جا رہا ہے...',
      noQuizAvailable: 'اس سبق کے لیے کوئی کوئز دستیاب نہیں۔',
      answerAllQuestions: 'جمع کرنے سے پہلے تمام سوالات کے جواب دیں۔',
      noLessonSelected: 'فی الحال کوئی سبق منتخب نہیں ہے۔',
      submitQuizFirst: 'اس سبق کو مکمل کرنے سے پہلے کوئز مکمل کرکے جمع کریں۔',
      lessonNotFound: 'سبق نہیں ملا۔',
      quizComplete: 'کوئز مکمل ہو گیا!',
      score: 'اسکور',
      youGot: 'آپ نے درست جواب دیے',
      outOf: 'میں سے',
      correct: 'درست۔',
      canCompleteLesson: 'اب آپ سبق مکمل کر سکتے ہیں۔',
      reviewLessonTryAgain: 'سبق کا جائزہ لیں اور دوبارہ کوشش کریں۔',

      selectCourse: "ماڈیولز اور اسباق دیکھنے کے لیے ایک کورس منتخب کریں:",
      backToCourses: "← کورسز پر واپس جائیں",
      backToModules: "← کورس ماڈیولز پر واپس جائیں",
      yourProgress: "آپ کی پیش رفت",
      lessonsComplete: "اسباق مکمل",
      noLessonsYet: "ابھی کوئی سبق نہیں",
      startLesson: "سبق شروع کریں",
      reviewLesson: "سبق دہرائیں",
      completed: "✓ مکمل",
      moduleComplete: "✓ ماڈیول مکمل",
      quickCheck: "فوری جانچ",
      submitAnswer: "جواب جمع کریں",
      nextLesson: "اگلا سبق",
      previousLesson: "پچھلا سبق",
      loading: "لوڈ ہو رہا ہے...",
      noDescription: "کوئی وضاحت دستیاب نہیں۔",
      noModules: "ابھی کوئی ماڈیول دستیاب نہیں۔",
      noLessons: "اس ماڈیول میں ابھی کوئی سبق دستیاب نہیں۔",
      unableToLoadCourse: "کورس لوڈ نہیں کیا جا سکا۔",
      unableToValidateQuiz: "کوئز کی توثیق نہیں کی جا سکی۔",
      lessonCompleted: "سبق کامیابی سے مکمل ہو گیا! 🎉",
      lessonCompletedSuccessfully: "سبق کامیابی سے مکمل ہو گیا! 🎉",
      failedToSaveProgress: "پیش رفت محفوظ نہیں کی جا سکی۔",
      selectLanguage: "زبان منتخب کریں"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    id: {
      noLessonContent: 'Tidak ada konten yang tersedia untuk pelajaran ini.',
      questionUnavailable: 'Pertanyaan tidak tersedia.',
      unsupportedQuestionType: 'Jenis pertanyaan tidak didukung:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Buka Kursus',
      unableToLoadCourses: 'Kursus tidak dapat dimuat.',
      invalidCourseId: 'ID kursus tidak valid.',
      questionInstruction: 'Jawab pertanyaan di bawah sebelum menyelesaikan pelajaran.',
      unableToConnect: 'Tidak dapat terhubung ke server.',
      completeLesson: 'Selesaikan Pelajaran',
      somethingWentWrong: 'Terjadi kesalahan.',
      checking: 'Memeriksa...',
      saving: 'Menyimpan...',
      noQuizAvailable: 'Tidak ada kuis yang tersedia untuk pelajaran ini.',
      answerAllQuestions: 'Jawab semua pertanyaan sebelum mengirim.',
      noLessonSelected: 'Belum ada pelajaran yang dipilih.',
      submitQuizFirst: 'Selesaikan dan kirim kuis sebelum menyelesaikan pelajaran ini.',
      lessonNotFound: 'Pelajaran tidak ditemukan.',
      quizComplete: 'Kuis selesai!',
      score: 'Skor',
      youGot: 'Anda menjawab benar',
      outOf: 'dari',
      correct: 'jawaban.',
      canCompleteLesson: 'Sekarang Anda dapat menyelesaikan pelajaran.',
      reviewLessonTryAgain: 'Tinjau pelajaran dan coba lagi.',

      selectCourse: "Pilih kursus untuk menjelajahi modul dan pelajaran:",
      backToCourses: "← Kembali ke kursus",
      backToModules: "← Kembali ke modul kursus",
      yourProgress: "Kemajuan Anda",
      lessonsComplete: "pelajaran selesai",
      noLessonsYet: "Belum ada pelajaran",
      startLesson: "Mulai Pelajaran",
      reviewLesson: "Tinjau Pelajaran",
      completed: "✓ Selesai",
      moduleComplete: "✓ Modul selesai",
      quickCheck: "Pemeriksaan Cepat",
      submitAnswer: "Kirim Jawaban",
      nextLesson: "Pelajaran Berikutnya",
      previousLesson: "Pelajaran Sebelumnya",
      loading: "Memuat...",
      noDescription: "Deskripsi tidak tersedia.",
      noModules: "Belum ada modul yang tersedia.",
      noLessons: "Belum ada pelajaran yang tersedia dalam modul ini.",
      unableToLoadCourse: "Kursus tidak dapat dimuat.",
      unableToValidateQuiz: "Kuis tidak dapat divalidasi.",
      lessonCompleted: "Pelajaran berhasil diselesaikan! 🎉",
      lessonCompletedSuccessfully: "Pelajaran berhasil diselesaikan! 🎉",
      failedToSaveProgress: "Kemajuan tidak dapat disimpan.",
      selectLanguage: "Pilih bahasa"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ms: {
      noLessonContent: 'Tiada kandungan tersedia untuk pelajaran ini.',
      questionUnavailable: 'Soalan tidak tersedia.',
      unsupportedQuestionType: 'Jenis soalan tidak disokong:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Buka Kursus',
      unableToLoadCourses: 'Kursus tidak dapat dimuat.',
      invalidCourseId: 'ID kursus tidak sah.',
      questionInstruction: 'Jawab soalan di bawah sebelum melengkapkan pelajaran.',
      unableToConnect: 'Tidak dapat menyambung ke pelayan.',
      completeLesson: 'Lengkapkan Pelajaran',
      somethingWentWrong: 'Sesuatu telah berlaku.',
      checking: 'Menyemak...',
      saving: 'Menyimpan...',
      noQuizAvailable: 'Tiada kuiz tersedia untuk pelajaran ini.',
      answerAllQuestions: 'Jawab semua soalan sebelum menghantar.',
      noLessonSelected: 'Tiada pelajaran dipilih pada masa ini.',
      submitQuizFirst: 'Lengkapkan dan hantar kuiz sebelum melengkapkan pelajaran ini.',
      lessonNotFound: 'Pelajaran tidak ditemui.',
      quizComplete: 'Kuiz selesai!',
      score: 'Skor',
      youGot: 'Anda mendapat',
      outOf: 'daripada',
      correct: 'jawapan betul.',
      canCompleteLesson: 'Anda kini boleh melengkapkan pelajaran.',
      reviewLessonTryAgain: 'Semak semula pelajaran dan cuba lagi.',

      selectCourse: "Pilih kursus untuk meneroka modul dan pelajaran:",
      backToCourses: "← Kembali ke kursus",
      backToModules: "← Kembali ke modul kursus",
      yourProgress: "Kemajuan Anda",
      lessonsComplete: "pelajaran selesai",
      noLessonsYet: "Belum ada pelajaran",
      startLesson: "Mula Pelajaran",
      reviewLesson: "Ulang Kaji Pelajaran",
      completed: "✓ Selesai",
      moduleComplete: "✓ Modul selesai",
      quickCheck: "Semakan Pantas",
      submitAnswer: "Hantar Jawapan",
      nextLesson: "Pelajaran Seterusnya",
      previousLesson: "Pelajaran Sebelumnya",
      loading: "Memuatkan...",
      noDescription: "Tiada penerangan tersedia.",
      noModules: "Belum ada modul yang tersedia.",
      noLessons: "Belum ada pelajaran tersedia dalam modul ini.",
      unableToLoadCourse: "Kursus tidak dapat dimuat.",
      unableToValidateQuiz: "Kuiz tidak dapat disahkan.",
      lessonCompleted: "Pelajaran berjaya diselesaikan! 🎉",
      lessonCompletedSuccessfully: "Pelajaran berjaya diselesaikan! 🎉",
      failedToSaveProgress: "Kemajuan tidak dapat disimpan.",
      selectLanguage: "Pilih bahasa"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    vi: {
      noLessonContent: 'Không có nội dung cho bài học này.',
      questionUnavailable: 'Câu hỏi không khả dụng.',
      unsupportedQuestionType: 'Loại câu hỏi không được hỗ trợ:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Mở khóa học',
      unableToLoadCourses: 'Không thể tải các khóa học.',
      invalidCourseId: 'ID khóa học không hợp lệ.',
      questionInstruction: 'Hãy trả lời các câu hỏi dưới đây trước khi hoàn thành bài học.',
      unableToConnect: 'Không thể kết nối với máy chủ.',
      completeLesson: 'Hoàn thành bài học',
      somethingWentWrong: 'Đã xảy ra lỗi.',
      checking: 'Đang kiểm tra...',
      saving: 'Đang lưu...',
      noQuizAvailable: 'Không có bài kiểm tra cho bài học này.',
      answerAllQuestions: 'Hãy trả lời tất cả câu hỏi trước khi gửi.',
      noLessonSelected: 'Hiện chưa chọn bài học nào.',
      submitQuizFirst: 'Hãy hoàn thành và gửi bài kiểm tra trước khi hoàn thành bài học này.',
      lessonNotFound: 'Không tìm thấy bài học.',
      quizComplete: 'Đã hoàn thành bài kiểm tra!',
      score: 'Điểm',
      youGot: 'Bạn trả lời đúng',
      outOf: 'trên',
      correct: 'câu.',
      canCompleteLesson: 'Bây giờ bạn có thể hoàn thành bài học.',
      reviewLessonTryAgain: 'Hãy xem lại bài học và thử lại.',

      selectCourse: "Chọn một khóa học để khám phá các mô-đun và bài học:",
      backToCourses: "← Quay lại khóa học",
      backToModules: "← Quay lại các mô-đun khóa học",
      yourProgress: "Tiến độ của bạn",
      lessonsComplete: "bài học đã hoàn thành",
      noLessonsYet: "Chưa có bài học",
      startLesson: "Bắt đầu bài học",
      reviewLesson: "Xem lại bài học",
      completed: "✓ Đã hoàn thành",
      moduleComplete: "✓ Đã hoàn thành mô-đun",
      quickCheck: "Kiểm tra nhanh",
      submitAnswer: "Gửi câu trả lời",
      nextLesson: "Bài học tiếp theo",
      previousLesson: "Bài học trước",
      loading: "Đang tải...",
      noDescription: "Không có mô tả.",
      noModules: "Chưa có mô-đun nào.",
      noLessons: "Chưa có bài học nào trong mô-đun này.",
      unableToLoadCourse: "Không thể tải khóa học.",
      unableToValidateQuiz: "Không thể xác thực bài kiểm tra.",
      lessonCompleted: "Bài học đã được hoàn thành thành công! 🎉",
      lessonCompletedSuccessfully: "Bài học đã được hoàn thành thành công! 🎉",
      failedToSaveProgress: "Không thể lưu tiến độ.",
      selectLanguage: "Chọn ngôn ngữ"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    th: {
      noLessonContent: 'ไม่มีเนื้อหาสำหรับบทเรียนนี้',
      questionUnavailable: 'ไม่มีคำถามนี้',
      unsupportedQuestionType: 'ไม่รองรับประเภทคำถาม:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'เปิดหลักสูตร',
      unableToLoadCourses: 'ไม่สามารถโหลดหลักสูตรได้',
      invalidCourseId: 'รหัสหลักสูตรไม่ถูกต้อง',
      questionInstruction: 'ตอบคำถามด้านล่างก่อนจบบทเรียน',
      unableToConnect: 'ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้',
      completeLesson: 'จบบทเรียน',
      somethingWentWrong: 'เกิดข้อผิดพลาด',
      checking: 'กำลังตรวจสอบ...',
      saving: 'กำลังบันทึก...',
      noQuizAvailable: 'ไม่มีแบบทดสอบสำหรับบทเรียนนี้',
      answerAllQuestions: 'ตอบคำถามทั้งหมดก่อนส่ง',
      noLessonSelected: 'ยังไม่ได้เลือกบทเรียน',
      submitQuizFirst: 'ทำแบบทดสอบและส่งคำตอบก่อนจบบทเรียนนี้',
      lessonNotFound: 'ไม่พบบทเรียน',
      quizComplete: 'ทำแบบทดสอบเสร็จแล้ว!',
      score: 'คะแนน',
      youGot: 'ตอบถูก',
      outOf: 'จาก',
      correct: 'ข้อ',
      canCompleteLesson: 'ตอนนี้คุณสามารถจบบทเรียนได้',
      reviewLessonTryAgain: 'ทบทวนบทเรียนแล้วลองอีกครั้ง',

      selectCourse: "เลือกหลักสูตรเพื่อสำรวจโมดูลและบทเรียน:",
      backToCourses: "← กลับไปยังหลักสูตร",
      backToModules: "← กลับไปยังโมดูลของหลักสูตร",
      yourProgress: "ความคืบหน้าของคุณ",
      lessonsComplete: "บทเรียนที่เสร็จแล้ว",
      noLessonsYet: "ยังไม่มีบทเรียน",
      startLesson: "เริ่มบทเรียน",
      reviewLesson: "ทบทวนบทเรียน",
      completed: "✓ เสร็จแล้ว",
      moduleComplete: "✓ โมดูลเสร็จสมบูรณ์",
      quickCheck: "ตรวจสอบด่วน",
      submitAnswer: "ส่งคำตอบ",
      nextLesson: "บทเรียนถัดไป",
      previousLesson: "บทเรียนก่อนหน้า",
      loading: "กำลังโหลด...",
      noDescription: "ไม่มีคำอธิบาย",
      noModules: "ยังไม่มีโมดูล",
      noLessons: "ยังไม่มีบทเรียนในโมดูลนี้",
      unableToLoadCourse: "ไม่สามารถโหลดหลักสูตรได้",
      unableToValidateQuiz: "ไม่สามารถตรวจสอบแบบทดสอบได้",
      lessonCompleted: "เรียนจบเรียบร้อยแล้ว! 🎉",
      lessonCompletedSuccessfully: "เรียนจบเรียบร้อยแล้ว! 🎉",
      failedToSaveProgress: "ไม่สามารถบันทึกความคืบหน้าได้",
      selectLanguage: "เลือกภาษา"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    zh: {
      noLessonContent: '本课程暂无内容。',
      questionUnavailable: '问题不可用。',
      unsupportedQuestionType: '不支持的问题类型：',

      untitledLesson: 'Untitled Lesson',

      openCourse: '打开课程',
      unableToLoadCourses: '无法加载课程。',
      invalidCourseId: '课程 ID 无效。',
      questionInstruction: '完成课程前，请回答下面的问题。',
      unableToConnect: '无法连接到服务器。',
      completeLesson: '完成课程',
      somethingWentWrong: '出了点问题。',
      checking: '正在检查...',
      saving: '正在保存...',
      noQuizAvailable: '本课程暂无测验。',
      answerAllQuestions: '提交前请回答所有问题。',
      noLessonSelected: '当前未选择课程。',
      submitQuizFirst: '请先完成并提交测验，再完成本课程。',
      lessonNotFound: '未找到课程。',
      quizComplete: '测验完成！',
      score: '得分',
      youGot: '你答对了',
      outOf: '共',
      correct: '题。',
      canCompleteLesson: '现在可以完成课程了。',
      reviewLessonTryAgain: '复习课程后再试一次。',

      selectCourse: "选择课程以探索模块和课程：",
      backToCourses: "← 返回课程",
      backToModules: "← 返回课程模块",
      yourProgress: "你的学习进度",
      lessonsComplete: "个课程已完成",
      noLessonsYet: "暂无课程",
      startLesson: "开始课程",
      reviewLesson: "复习课程",
      completed: "✓ 已完成",
      moduleComplete: "✓ 模块已完成",
      quickCheck: "快速检查",
      submitAnswer: "提交答案",
      nextLesson: "下一课",
      previousLesson: "上一课",
      loading: "加载中...",
      noDescription: "暂无描述。",
      noModules: "暂无可用模块。",
      noLessons: "此模块暂无可用课程。",
      unableToLoadCourse: "无法加载课程。",
      unableToValidateQuiz: "无法验证测验。",
      lessonCompleted: "课程已成功完成！🎉",
      lessonCompletedSuccessfully: "课程已成功完成！🎉",
      failedToSaveProgress: "无法保存学习进度。",
      selectLanguage: "选择语言"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ja: {
      noLessonContent: 'このレッスンには利用可能なコンテンツがありません。',
      questionUnavailable: '質問を利用できません。',
      unsupportedQuestionType: 'サポートされていない質問タイプ：',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'コースを開く',
      unableToLoadCourses: 'コースを読み込めませんでした。',
      invalidCourseId: '無効なコースIDです。',
      questionInstruction: 'レッスンを完了する前に、以下の質問に答えてください。',
      unableToConnect: 'サーバーに接続できません。',
      completeLesson: 'レッスンを完了',
      somethingWentWrong: '問題が発生しました。',
      checking: '確認中...',
      saving: '保存中...',
      noQuizAvailable: 'このレッスンにはクイズがありません。',
      answerAllQuestions: '送信する前にすべての質問に答えてください。',
      noLessonSelected: '現在レッスンが選択されていません。',
      submitQuizFirst: 'このレッスンを完了する前に、クイズを完了して送信してください。',
      lessonNotFound: 'レッスンが見つかりません。',
      quizComplete: 'クイズ完了！',
      score: 'スコア',
      youGot: '正解数',
      outOf: '全',
      correct: '問中。',
      canCompleteLesson: 'これでレッスンを完了できます。',
      reviewLessonTryAgain: 'レッスンを復習してもう一度試してください。',

      selectCourse: "モジュールとレッスンを見るにはコースを選択してください：",
      backToCourses: "← コースに戻る",
      backToModules: "← コースモジュールに戻る",
      yourProgress: "あなたの進捗",
      lessonsComplete: "レッスン完了",
      noLessonsYet: "レッスンはまだありません",
      startLesson: "レッスンを開始",
      reviewLesson: "レッスンを復習",
      completed: "✓ 完了",
      moduleComplete: "✓ モジュール完了",
      quickCheck: "クイックチェック",
      submitAnswer: "回答を送信",
      nextLesson: "次のレッスン",
      previousLesson: "前のレッスン",
      loading: "読み込み中...",
      noDescription: "説明はありません。",
      noModules: "利用可能なモジュールはまだありません。",
      noLessons: "このモジュールにはまだレッスンがありません。",
      unableToLoadCourse: "コースを読み込めませんでした。",
      unableToValidateQuiz: "クイズを検証できませんでした。",
      lessonCompleted: "レッスンを正常に完了しました！🎉",
      lessonCompletedSuccessfully: "レッスンを正常に完了しました！🎉",
      failedToSaveProgress: "進捗を保存できませんでした。",
      selectLanguage: "言語を選択"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ko: {
      noLessonContent: '이 수업에 사용할 수 있는 콘텐츠가 없습니다.',
      questionUnavailable: '질문을 사용할 수 없습니다.',
      unsupportedQuestionType: '지원되지 않는 질문 유형:',

      untitledLesson: 'Untitled Lesson',

      openCourse: '코스 열기',
      unableToLoadCourses: '코스를 불러올 수 없습니다.',
      invalidCourseId: '잘못된 코스 ID입니다.',
      questionInstruction: '수업을 완료하기 전에 아래 질문에 답하세요.',
      unableToConnect: '서버에 연결할 수 없습니다.',
      completeLesson: '수업 완료',
      somethingWentWrong: '문제가 발생했습니다.',
      checking: '확인 중...',
      saving: '저장 중...',
      noQuizAvailable: '이 수업에는 사용할 수 있는 퀴즈가 없습니다.',
      answerAllQuestions: '제출하기 전에 모든 질문에 답하세요.',
      noLessonSelected: '현재 선택된 수업이 없습니다.',
      submitQuizFirst: '이 수업을 완료하기 전에 퀴즈를 완료하고 제출하세요.',
      lessonNotFound: '수업을 찾을 수 없습니다.',
      quizComplete: '퀴즈 완료!',
      score: '점수',
      youGot: '정답',
      outOf: '총',
      correct: '개.',
      canCompleteLesson: '이제 수업을 완료할 수 있습니다.',
      reviewLessonTryAgain: '수업을 다시 살펴보고 시도해 보세요.',

      selectCourse: "모듈과 수업을 살펴보려면 코스를 선택하세요:",
      backToCourses: "← 코스로 돌아가기",
      backToModules: "← 코스 모듈로 돌아가기",
      yourProgress: "학습 진행률",
      lessonsComplete: "수업 완료",
      noLessonsYet: "아직 수업이 없습니다",
      startLesson: "수업 시작",
      reviewLesson: "수업 복습",
      completed: "✓ 완료",
      moduleComplete: "✓ 모듈 완료",
      quickCheck: "빠른 확인",
      submitAnswer: "답변 제출",
      nextLesson: "다음 수업",
      previousLesson: "이전 수업",
      loading: "로드 중...",
      noDescription: "설명이 없습니다.",
      noModules: "아직 사용할 수 있는 모듈이 없습니다.",
      noLessons: "이 모듈에는 아직 사용할 수 있는 수업이 없습니다.",
      unableToLoadCourse: "코스를 불러올 수 없습니다.",
      unableToValidateQuiz: "퀴즈를 확인할 수 없습니다.",
      lessonCompleted: "레슨이 성공적으로 완료되었습니다! 🎉",
      lessonCompletedSuccessfully: "레슨이 성공적으로 완료되었습니다! 🎉",
      failedToSaveProgress: "진행 상황을 저장할 수 없습니다.",
      selectLanguage: "언어 선택"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    sw: {
      noLessonContent: 'Hakuna maudhui yanayopatikana kwa somo hili.',
      questionUnavailable: 'Swali halipatikani.',
      unsupportedQuestionType: 'Aina ya swali isiyotumika:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Fungua Kozi',
      unableToLoadCourses: 'Imeshindwa kupakia kozi.',
      invalidCourseId: 'Kitambulisho cha kozi si sahihi.',
      questionInstruction: 'Jibu maswali yaliyo hapa chini kabla ya kukamilisha somo.',
      unableToConnect: 'Imeshindwa kuunganisha na seva.',
      completeLesson: 'Kamilisha Somo',
      somethingWentWrong: 'Kuna tatizo limetokea.',
      checking: 'Inakagua...',
      saving: 'Inahifadhi...',
      noQuizAvailable: 'Hakuna jaribio linalopatikana kwa somo hili.',
      answerAllQuestions: 'Jibu maswali yote kabla ya kutuma.',
      noLessonSelected: 'Hakuna somo lililochaguliwa kwa sasa.',
      submitQuizFirst: 'Kamilisha na utume jaribio kabla ya kukamilisha somo hili.',
      lessonNotFound: 'Somo halikupatikana.',
      quizComplete: 'Jaribio limekamilika!',
      score: 'Alama',
      youGot: 'Umejibu kwa usahihi',
      outOf: 'kati ya',
      correct: 'majibu.',
      canCompleteLesson: 'Sasa unaweza kukamilisha somo.',
      reviewLessonTryAgain: 'Pitia somo na ujaribu tena.',

      selectCourse: "Chagua kozi ili kuchunguza moduli na masomo:",
      backToCourses: "← Rudi kwenye kozi",
      backToModules: "← Rudi kwenye moduli za kozi",
      yourProgress: "Maendeleo yako",
      lessonsComplete: "masomo yamekamilika",
      noLessonsYet: "Hakuna masomo bado",
      startLesson: "Anza Somo",
      reviewLesson: "Pitia Somo",
      completed: "✓ Imekamilika",
      moduleComplete: "✓ Moduli imekamilika",
      quickCheck: "Ukaguzi wa Haraka",
      submitAnswer: "Wasilisha Jibu",
      nextLesson: "Somo Linalofuata",
      previousLesson: "Somo Lililotangulia",
      loading: "Inapakia...",
      noDescription: "Hakuna maelezo yanayopatikana.",
      noModules: "Hakuna moduli zinazopatikana bado.",
      noLessons: "Hakuna masomo yanayopatikana katika moduli hii bado.",
      unableToLoadCourse: "Imeshindwa kupakia kozi.",
      unableToValidateQuiz: "Imeshindwa kuthibitisha jaribio.",
      lessonCompleted: "Somo limekamilika kwa mafanikio! 🎉",
      lessonCompletedSuccessfully: "Somo limekamilika kwa mafanikio! 🎉",
      failedToSaveProgress: "Imeshindwa kuhifadhi maendeleo.",
      selectLanguage: "Chagua lugha"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    yo: {
      noLessonContent: 'Ko si akoonu tó wà fún ẹ̀kọ́ yìí.',
      questionUnavailable: 'Ìbéèrè kò sí.',
      unsupportedQuestionType: 'Irú ìbéèrè tí a kò ṣe àtìlẹ́yìn fún:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Ṣí Ẹkọ',
      unableToLoadCourses: 'A kò lè gbe àwọn ẹkọ wọlé.',
      invalidCourseId: 'ID ẹkọ kò tọ́.',
      questionInstruction: 'Dáhùn àwọn ìbéèrè tó wà ní isalẹ kí o tó parí ẹkọ.',
      unableToConnect: 'A kò lè sopọ̀ mọ́ olupin.',
      completeLesson: 'Parí Ẹkọ',
      somethingWentWrong: 'Ohun kan ṣẹlẹ̀ tí kò tọ́.',
      checking: 'Ń ṣàyẹ̀wò...',
      saving: 'Ń fipamọ́...',
      noQuizAvailable: 'Ko si idanwo fun ẹkọ yii.',
      answerAllQuestions: 'Dáhùn gbogbo àwọn ìbéèrè kí o tó fi ránṣẹ́.',
      noLessonSelected: 'A kò yan ẹkọ kankan báyìí.',
      submitQuizFirst: 'Parí kí o sì fi idanwo ránṣẹ́ kí o tó parí ẹkọ yii.',
      lessonNotFound: 'A kò rí ẹkọ náà.',
      quizComplete: 'Idanwo ti parí!',
      score: 'Àmì',
      youGot: 'O dáhùn tọ́',
      outOf: 'nínú',
      correct: 'dáhùn.',
      canCompleteLesson: 'O lè parí ẹkọ báyìí.',
      reviewLessonTryAgain: 'Ṣàtúnyẹ̀wò ẹkọ náà kí o sì tún gbìyànjú.',

      selectCourse: "Yan ẹkọ kan lati ṣawari awọn modulu ati awọn ẹkọ:",
      backToCourses: "← Pada si awọn ẹkọ",
      backToModules: "← Pada si awọn modulu ẹkọ",
      yourProgress: "Ilọsiwaju rẹ",
      lessonsComplete: "awọn ẹkọ ti pari",
      noLessonsYet: "Ko si ẹkọ sibẹ",
      startLesson: "Bẹrẹ Ẹkọ",
      reviewLesson: "Tun Ẹkọ Wo",
      completed: "✓ Ti pari",
      moduleComplete: "✓ Modulu ti pari",
      quickCheck: "Ayẹwo Yara",
      submitAnswer: "Fi Idahun Ranṣẹ",
      nextLesson: "Ẹkọ Tókàn",
      previousLesson: "Ẹkọ Ṣaaju",
      loading: "N n gbe...",
      noDescription: "Ko si apejuwe ti o wa.",
      noModules: "Ko si modulu ti o wa sibẹ.",
      noLessons: "Ko si ẹkọ ti o wa ninu modulu yii sibẹ.",
      unableToLoadCourse: "Ko ṣee ṣe lati gbe ẹkọ naa wọle.",
      unableToValidateQuiz: "Ko ṣee ṣe lati jẹrisi idanwo naa.",
      lessonCompleted: "A ti pari ẹkọ naa ni aṣeyọri! 🎉",
      lessonCompletedSuccessfully: "A ti pari ẹkọ naa ni aṣeyọri! 🎉",
      failedToSaveProgress: "Ko ṣee ṣe lati fipamọ ilọsiwaju.",
      selectLanguage: "Yan ede"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ig: {
      noLessonContent: 'Enweghị ọdịnaya dị maka nkuzi a.',
      questionUnavailable: 'Ajụjụ adịghị.',
      unsupportedQuestionType: 'Ụdị ajụjụ anaghị akwado:',

      untitledLesson: 'Untitled Lesson',

      openCourse: 'Mepee Nkuzi',
      unableToLoadCourses: 'Enweghị ike ibunye nkuzi.',
      invalidCourseId: 'ID nkuzi ezighi ezi.',
      questionInstruction: "Zaa ajụjụ ndị dị n'okpuru tupu ịmechaa nkuzi.",
      unableToConnect: 'Enweghị ike ijikọ na sava.',
      completeLesson: 'Mechaa Nkuzi',
      somethingWentWrong: 'Ihe adịghị mma mere.',
      checking: 'A na-enyocha...',
      saving: 'A na-echekwa...',
      noQuizAvailable: 'Enweghị ule dị maka nkuzi a.',
      answerAllQuestions: 'Zaa ajụjụ niile tupu izipu.',
      noLessonSelected: 'Enweghị nkuzi ahọpụtara ugbu a.',
      submitQuizFirst: 'Mechaa ma zipụ ule tupu ịmechaa nkuzi a.',
      lessonNotFound: 'Achọtaghị nkuzi.',
      quizComplete: 'Ule agwụla!',
      score: 'Akara',
      youGot: 'Ị zara nke ọma',
      outOf: "n'ime",
      correct: 'azịza.',
      canCompleteLesson: 'Ị nwere ike imecha nkuzi ugbu a.',
      reviewLessonTryAgain: 'Nyochaa nkuzi ahụ ma nwaa ọzọ.',

      selectCourse: "Họrọ nkuzi iji nyochaa modul na nkuzi:",
      backToCourses: "← Laghachi na nkuzi",
      backToModules: "← Laghachi na modul nkuzi",
      yourProgress: "Ọganihu gị",
      lessonsComplete: "nkuzi emechara",
      noLessonsYet: "Enweghị nkuzi ugbu a",
      startLesson: "Malite Nkuzi",
      reviewLesson: "Nyochaa Nkuzi",
      completed: "✓ Emechara",
      moduleComplete: "✓ Modul emechara",
      quickCheck: "Nlele Ngwa ngwa",
      submitAnswer: "Nyefee Azịza",
      nextLesson: "Nkuzi Na-esote",
      previousLesson: "Nkuzi Gara Aga",
      loading: "Na-ebunye...",
      noDescription: "Enweghị nkọwa dị.",
      noModules: "Enweghị modul dị ugbu a.",
      noLessons: "Enweghị nkuzi dị na modul a ugbu a.",
      unableToLoadCourse: "Enweghị ike ibunye nkuzi ahụ.",
      unableToValidateQuiz: "Enweghị ike ịkwado ule ahụ.",
      lessonCompleted: "Emechara nkuzi ahụ nke ọma! 🎉",
      lessonCompletedSuccessfully: "Emechara nkuzi ahụ nke ọma! 🎉",
      failedToSaveProgress: "Enweghị ike ịchekwa ọganihu.",
      selectLanguage: "Họrọ asụsụ"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    },

    ha: {
      untitledLesson: 'Darasi mara suna',
      noLessonContent: 'Babu abun ciki da ake da shi don wannan darasin.',
      questionUnavailable: 'Ba a samun tambayar.',
      unsupportedQuestionType: 'Nau\'in tambayar da ba a tallafa wa:',
      openCourse: 'Buɗe Kwas',
      unableToLoadCourses: 'Ba a iya loda kwas-kwasan ba.',
      invalidCourseId: 'ID ɗin kwas ba daidai ba ne.',
      questionInstruction: 'Amsa tambayoyin da ke ƙasa kafin ka kammala darasin.',
      unableToConnect: 'Ba a iya haɗawa da uwar garke ba.',
      completeLesson: 'Kammala Darasi',
      somethingWentWrong: 'Wani abu ya faru ba daidai ba.',
      checking: 'Ana dubawa...',
      saving: 'Ana adanawa...',
      noQuizAvailable: 'Babu gwaji da ake da shi don wannan darasi.',
      answerAllQuestions: 'Amsa duk tambayoyin kafin aikawa.',
      noLessonSelected: 'Ba a zaɓi wani darasi a yanzu ba.',
      submitQuizFirst: 'Kammala kuma aika gwajin kafin ka kammala wannan darasi.',
      lessonNotFound: 'Ba a sami darasin ba.',
      quizComplete: 'An kammala gwajin!',
      score: 'Maki',
      youGot: 'Ka amsa daidai',
      outOf: 'cikin',
      correct: 'amsoshi.',
      canCompleteLesson: 'Yanzu za ka iya kammala darasin.',
      reviewLessonTryAgain: 'Sake duba darasin sannan ka sake gwadawa.',

      selectCourse: "Zaɓi kwas don duba sassa da darussa:",
      backToCourses: "← Koma zuwa kwas",
      backToModules: "← Koma zuwa sassan kwas",
      yourProgress: "Ci gabanka",
      lessonsComplete: "darussa da aka kammala",
      noLessonsYet: "Babu darasi tukuna",
      startLesson: "Fara Darasi",
      reviewLesson: "Duba Darasi",
      completed: "✓ An kammala",
      moduleComplete: "✓ An kammala sashe",
      quickCheck: "Dubawa cikin sauri",
      submitAnswer: "Aika Amsa",
      nextLesson: "Darasi na gaba",
      previousLesson: "Darasin baya",
      loading: "Ana lodawa...",
      noDescription: "Babu bayanin da ake da shi.",
      noModules: "Babu sassa da ake da su tukuna.",
      noLessons: "Babu darussa da ake da su a wannan sashe tukuna.",
      unableToLoadCourse: "Ba a iya loda kwas ɗin ba.",
      unableToValidateQuiz: "Ba a iya tantance gwajin ba.",
      lessonCompleted: "An kammala darasin cikin nasara! 🎉",
      lessonCompletedSuccessfully: "An kammala darasin cikin nasara! 🎉",
      failedToSaveProgress: "Ba a iya adana ci gaba ba.",
      selectLanguage: "Zaɓi harshe"

,
      home: 'Home',
      learn: 'Learn',
      funCenter: 'Fun Center',
      aiTutor: 'AI Tutor',
      xp: 'XP',
      streak: 'Streak',
      lessonsCompleted: 'Lessons completed',
      averageQuizScore: 'Average quiz score',
      pro: 'Pro',
      premium: 'Premium',
      settings: 'Settings',

    }
  };

  function miimiidTranslate(key, language) {
    const activeLanguage =
      MIIMIID_TRANSLATIONS[language]
        ? language
        : "en";

    return (
      MIIMIID_TRANSLATIONS[
        activeLanguage
      ][key] ||
      MIIMIID_TRANSLATIONS.en[key] ||
      key
    );
  }

  function getSavedLanguage() {
    try {
      const saved = localStorage.getItem(MIIMIID_LANGUAGE_KEY);

      if (saved && MIIMIID_LANGUAGES[saved]) {
        return saved;
      }
    } catch (error) {
      console.warn("Miimiid could not read saved language preference.");
    }

    return "en";
  }

  function saveLanguage(language) {
    try {
      localStorage.setItem(MIIMIID_LANGUAGE_KEY, language);
    } catch (error) {
      console.warn("Miimiid could not save language preference.");
    }
  }

  function updateLanguageUI(language) {
    const languageData =
      MIIMIID_LANGUAGES[language];

    if (!languageData) {
      return;
    }

    const label =
      document.getElementById(
        "selected-language-label"
      );

    const menu =
      document.getElementById(
        "language-menu"
      );

    if (label) {
      label.textContent =
        languageData.name;
    }

    /*
     * Build the language menu directly
     * from MIIMIID_LANGUAGES.
     */
    if (menu) {
      menu.innerHTML = Object.entries(
        MIIMIID_LANGUAGES
      )
        .map(
          ([code, data]) => {
            const isActive =
              code === language;

            return `
              <button
                type="button"
                class="language-option ${
                  isActive ? "active" : ""
                }"
                data-language="${code}"
                role="menuitem"
                aria-current="${
                  isActive ? "true" : "false"
                }"
              >
                <span class="language-option-name">
                  <span>
                    ${data.name}
                  </span>
                  <span class="language-option-native">
                    ${data.nativeName}
                  </span>
                </span>

                ${
                  isActive
                    ? '<span class="language-check">✓</span>'
                    : ""
                }
              </button>
            `;
          }
        )
        .join("");
    }

    document.documentElement.lang =
      language;
  }

  function applyMiimiidTranslations(language) {

    const activeLanguage =
      MIIMIID_TRANSLATIONS[language]
        ? language
        : "en";

    const t = key =>
      miimiidTranslate(
        key,
        activeLanguage
      );

    /*
     * Static course/detail UI
     */
    const elements = {
      "course-progress-title": "yourProgress",
      "course-progress-text": "lessonsCompleted",
      "lesson-back-btn": "backToModules",
      "quiz-title": "quickCheck",
      "quiz-submit-btn": "submitAnswer",
      "complete-btn": "completeLesson",
      "previous-lesson-btn": "previousLesson",
      "next-lesson-btn": "nextLesson"
    };

    Object.entries(elements).forEach(
      ([id, key]) => {

        const element =
          document.getElementById(id);

        if (!element) {
          return;
        }

        element.textContent = t(key);
      }
    );

    /*
     * Re-render dynamic course content
     * so translated buttons/progress text
     * appear immediately.
     */
    if (
      courseDataCache &&
      Array.isArray(courseDataCache.modules)
    ) {

      renderModules(
        courseDataCache.modules
      );

      if (currentCourseId) {
        loadCourseProgress(
          currentCourseId
        );
      }
    }

    /*
     * Keep the HTML language attribute
     * synchronized with the active language.
     */
    document.documentElement.lang =
      activeLanguage;
  }

  function closeLanguageMenu() {
    const selector = document.getElementById("language-selector");
    const toggle = document.getElementById("language-toggle");
    const menu = document.getElementById("language-menu");

    if (!selector || !toggle || !menu) {
      return;
    }

    selector.classList.remove("open");
    menu.classList.add("hidden");
    toggle.setAttribute("aria-expanded", "false");
  }

  function openLanguageMenu() {
    const selector = document.getElementById("language-selector");
    const toggle = document.getElementById("language-toggle");
    const menu = document.getElementById("language-menu");

    if (!selector || !toggle || !menu) {
      return;
    }

    selector.classList.add("open");
    menu.classList.remove("hidden");
    toggle.setAttribute("aria-expanded", "true");
  }

  function toggleLanguageMenu() {
    const selector = document.getElementById("language-selector");

    if (!selector) {
      return;
    }

    if (selector.classList.contains("open")) {
      closeLanguageMenu();
    } else {
      openLanguageMenu();
    }
  }

  function selectLanguage(language) {
    if (!MIIMIID_LANGUAGES[language]) {
      return;
    }

    saveLanguage(language);
    updateLanguageUI(language);
    closeLanguageMenu();

    applyMiimiidTranslations(language);

    document.dispatchEvent(
      new CustomEvent("miimiidLanguageChanged", {
        detail: {
          language,
          languageData: MIIMIID_LANGUAGES[language]
        }
      })
    );
  }

  function initializeLanguageSelector() {
    const toggle = document.getElementById("language-toggle");

    if (!toggle) {
      return;
    }

    const savedLanguage = getSavedLanguage();

    updateLanguageUI(savedLanguage);
    applyMiimiidTranslations(savedLanguage);

    toggle.addEventListener("click", toggleLanguageMenu);

    const menu =
      document.getElementById(
        "language-menu"
      );

    if (menu) {
      menu.addEventListener(
        "click",
        event => {
          const option =
            event.target.closest(
              ".language-option"
            );

          if (!option) {
            return;
          }

          selectLanguage(
            option.dataset.language
          );
        }
      );
    }

    document.addEventListener("click", event => {
      const selector = document.getElementById("language-selector");

      if (selector && !selector.contains(event.target)) {
        closeLanguageMenu();
      }
    });

    toggle.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeLanguageMenu();
        toggle.focus();
      }
    });

    document.addEventListener("keydown", event => {
      if (event.key === "Escape") {
        closeLanguageMenu();
      }
    });
  }

  /*
   * =========================================
   * LANGUAGE CHANGE REFRESH
   * =========================================
   */

  document.addEventListener(
    "miimiidLanguageChanged",
    async () => {

      const language =
        getSavedLanguage();

      /*
       * =====================================================
       * MIIMIID DYNAMIC LOCALIZATION REFRESH
       * =====================================================
       *
       * Every visible surface must be rebuilt from its
       * existing data/state. No hardcoded replacement UI
       * is introduced here.
       */

      document.documentElement.lang =
        language;

      /*
       * Dashboard
       *
       * Re-render the existing dashboard registry and data
       * so navigation labels, statistics, and drawer labels
       * immediately use the selected language.
       */
      renderMiimiidBottomNavigation();

      if (
        typeof renderMiimiidDashboard === "function" &&
        miimiidDashboardData
      ) {
        renderMiimiidDashboard();
      } else {
        renderMiimiidDashboardMenu();
      }

      /*
       * Learning state.
       *
       * Preserve the learner's current course and lesson
       * before refreshing translated course data.
       */
      const courseId =
        currentCourseId;

      const lessonId =
        currentLessonId;

      const courseList =
        document.getElementById(
          "course-list-view"
        );

      const courseDetail =
        document.getElementById(
          "course-detail-view"
        );

      const lessonView =
        document.getElementById(
          "lesson-view"
        );

      /*
       * If the learner is currently browsing the course
       * list, reload the real course data in the selected
       * language.
       */
      if (
        courseList &&
        !courseList.classList.contains("hidden")
      ) {
        await fetchCourses();
        return;
      }

      /*
       * If a real course is open, reload its complete
       * translated tree.
       */
      if (courseId) {

        await openCourse(
          courseId
        );

        /*
         * Restore the exact lesson only when the learner
         * was actually inside one.
         */
        if (
          lessonId &&
          lessonView
        ) {
          openLesson(
            lessonId
          );
        }

        return;
      }

      /*
       * If no course is active, still ensure the static
       * translation layer has been applied to the existing
       * shell.
       */
      applyMiimiidTranslations(
        language
      );
    }
  );

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeLanguageSelector
    );
  } else {
    initializeLanguageSelector();
  }

  if (document.readyState === "loading") {
    document.addEventListener(
      "DOMContentLoaded",
      initializeMiimiidApplication
    );
  } else {
    initializeMiimiidApplication();
  }

