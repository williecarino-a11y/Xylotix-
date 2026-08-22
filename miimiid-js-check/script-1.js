


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

    function applyMiimiidAuthTranslations() {
      const authElements =
        document.querySelectorAll(
          "[data-miimiid-auth-key]"
        );

      authElements.forEach((element) => {
        const key =
          element.getAttribute(
            "data-miimiid-auth-key"
          );

        if (!key) {
          return;
        }

        element.textContent =
          miimiidDashboardTranslate(key);
      });

      const authLoading =
        document.getElementById(
          "miimiid-auth-loading"
        );

      if (authLoading) {
        authLoading.textContent =
          miimiidDashboardTranslate(
            "authCheckingSession"
          );
      }

      const passwordToggles =
        document.querySelectorAll(
          ".miimiid-password-toggle"
        );

      passwordToggles.forEach((toggle) => {
        const targetId =
          toggle.getAttribute(
            "data-password-target"
          );

        const input =
          document.getElementById(targetId);

        const isVisible =
          input &&
          input.type === "text";

        toggle.setAttribute(
          "aria-label",
          miimiidDashboardTranslate(
            isVisible
              ? "authHidePassword"
              : "authShowPassword"
          )
        );
      });
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
            miimiidDashboardTranslate("authResetPasswordTitle");
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
            miimiidDashboardTranslate("authResetPasswordSubtitle");
        } else {
          subtitle.textContent =
            miimiidDashboardTranslate("authSignInSubtitle");
        }
      }

      setMiimiidAuthStatus("");
      applyMiimiidAuthTranslations();
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

    async function handleMiimiidRegister(event) {
      event.preventDefault();

      const name =
        document
          .getElementById(
            "miimiid-register-name"
          )
          ?.value
          .trim();

      const email =
        document
          .getElementById(
            "miimiid-register-email"
          )
          ?.value
          .trim();

      const phone =
        document
          .getElementById(
            "miimiid-register-phone"
          )
          ?.value
          .trim();

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

      const submit =
        document.getElementById(
          "miimiid-register-submit"
        );

      if (password !== confirm) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authPasswordMismatch"),
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        miimiidDashboardTranslate("authCreatingAccount")
      );

      try {
        await miimiidAuthenticate(
          "/api/auth/register",
          {
            name,
            email,
            phone,
            password
          }
        );

        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authAccountCreated"),
          "success"
        );

        hideMiimiidAuthView();

        await initializeMiimiidDashboard();

      } catch (error) {
        console.error(
          "Miimiid registration error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          miimiidDashboardTranslate("authCreateAccountError"),
          "error"
        );

      } finally {
        if (submit) {
          submit.disabled = false;
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
          miimiidDashboardTranslate("authEnterEmail"),
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        miimiidDashboardTranslate("authSendingResetInstructions")
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
              : miimiidDashboardTranslate("authRequestResetError")
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          miimiidDashboardTranslate("authResetInstructionsSent"),
          "success"
        );

      } catch (error) {
        console.error(
          "Miimiid password reset request error:",
          error
        );

        setMiimiidAuthStatus(
          error.message ||
          miimiidDashboardTranslate("authRequestResetError"),
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
          miimiidDashboardTranslate("authInvalidResetLink"),
          "error"
        );
        return;
      }

      if (password.length < 8) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authPasswordMinLength"),
          "error"
        );
        return;
      }

      if (password !== confirmPassword) {
        setMiimiidAuthStatus(
          miimiidDashboardTranslate("authPasswordMismatch"),
          "error"
        );
        return;
      }

      if (submit) {
        submit.disabled = true;
      }

      setMiimiidAuthStatus(
        miimiidDashboardTranslate("authResettingPassword")
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
              : miimiidDashboardTranslate("authResetPasswordError")
          );
        }

        setMiimiidAuthStatus(
          result.message ||
          miimiidDashboardTranslate("authPasswordResetSuccess"),
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
          miimiidDashboardTranslate("authResetPasswordError"),
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

    function initializeMiimiidPasswordToggles() {
      const toggles =
        document.querySelectorAll(
          ".miimiid-password-toggle"
        );

      toggles.forEach((toggle) => {
        toggle.addEventListener(
          "click",
          () => {
            const targetId =
              toggle.getAttribute(
                "data-password-target"
              );

            const input =
              document.getElementById(targetId);

            if (!input) {
              return;
            }

            const isVisible =
              input.type === "text";

            input.type =
              isVisible ? "password" : "text";

            toggle.setAttribute(
              "aria-pressed",
              String(!isVisible)
            );

            toggle.setAttribute(
              "aria-label",
              miimiidDashboardTranslate(
                isVisible
                  ? "authShowPassword"
                  : "authHidePassword"
              )
            );

            toggle.innerHTML =
              isVisible
                ? `${eyeHiddenIcon()}`
                : `${eyeVisibleIcon()}`;
          }
        );
      });
    }

    const MIIMIID_EYE_HIDDEN_SVG = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"></path>
        <circle cx="12" cy="12" r="3"></circle>
      </svg>
    `;

    const MIIMIID_EYE_VISIBLE_SVG = `
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3l18 18"></path>
        <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8"></path>
        <path d="M9.9 4.2A10.8 10.8 0 0 1 12 4c6.5 0 10 8 10 8a17.8 17.8 0 0 1-3.1 4.4"></path>
        <path d="M6.1 6.1C3.5 8.2 2 12 2 12s3.5 8 10 8c1.3 0 2.5-.3 3.6-.7"></path>
      </svg>
    `;

    function eyeHiddenIcon() {
      return MIIMIID_EYE_HIDDEN_SVG;
    }

    function eyeVisibleIcon() {
      return MIIMIID_EYE_VISIBLE_SVG;
    }

    function initializeMiimiidAuth() {
      if (miimiidAuthInitialized) {
        return;
      }

      miimiidAuthInitialized = true;

      initializeMiimiidPasswordToggles();
      applyMiimiidAuthTranslations();

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

    async function initializeMiimiidApplication() {
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

      const miimiidHeader =
        document.querySelector(
          ".miimiid-header"
        );

      const drawerBackdrop =
        document.getElementById(
          "miimiid-drawer-backdrop"
        );

      /*
       * Never expose authenticated application
       * chrome or dashboard data while
       * authentication state is unknown.
       */
      if (appShell) {
        appShell.classList.add("hidden");
      }

      if (miimiidHeader) {
        miimiidHeader.classList.add("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.add("hidden");
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

      if (miimiidHeader) {
        miimiidHeader.classList.remove("hidden");
      }

      if (drawerBackdrop) {
        drawerBackdrop.classList.remove("hidden");
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

  