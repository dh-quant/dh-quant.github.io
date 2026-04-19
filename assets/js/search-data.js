// get the ninja-keys element
const ninja = document.querySelector('ninja-keys');

// add the home and posts menu items
ninja.data = [{
    id: "nav-about",
    title: "about",
    section: "Navigation",
    handler: () => {
      window.location.href = "/";
    },
  },{id: "nav-blog",
          title: "blog",
          description: "",
          section: "Navigation",
          handler: () => {
            window.location.href = "/blog/";
          },
        },{id: "nav-projects",
          title: "projects",
          description: "퀀트 전략, 분석 툴, 사이드 프로젝트 모음.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/projects/";
          },
        },{id: "nav-cv",
          title: "CV",
          description: "Donghyeok Kim | KENTECH",
          section: "Navigation",
          handler: () => {
            window.location.href = "/cv/";
          },
        },{id: "nav-gallery",
          title: "gallery",
          description: "사진 모음",
          section: "Navigation",
          handler: () => {
            window.location.href = "/gallery/";
          },
        },{id: "post-매매-복기-2026-04-16-nq-long",
        
          title: "매매 복기 | 2026-04-16 NQ Long",
        
        description: "거래량 수렴 구간에서의 유동성 스윕 포착 및 국지 추세 진입",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/trading-journal/";
          
        },
      },{id: "projects-quant-backtester",
          title: 'Quant Backtester',
          description: "파이썬으로 직접 만든 전략 백테스팅 엔진 — 체결 지연 · 슬리피지 · 수수료까지 반영.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/1_quant_backtester/";
            },},{id: "projects-vol-targeted-momentum",
          title: 'Vol-Targeted Momentum',
          description: "변동성 타겟팅으로 드로우다운을 억제하는 크로스-에셋 모멘텀 전략.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/2_vol_targeting/";
            },},{id: "projects-market-dashboard",
          title: 'Market Dashboard',
          description: "실시간 매크로 · 섹터 · 자금흐름을 한 화면에서 보는 개인용 트레이딩 대시보드.",
          section: "Projects",handler: () => {
              window.location.href = "/projects/3_market_dashboard/";
            },},{
        id: 'social-email',
        title: 'email',
        section: 'Socials',
        handler: () => {
          window.open("mailto:%6C%75%63%61%73%6B%64%68@%6B%65%6E%74%65%63%68.%61%63.%6B%72", "_blank");
        },
      },{
        id: 'social-github',
        title: 'GitHub',
        section: 'Socials',
        handler: () => {
          window.open("https://github.com/dh-quant", "_blank");
        },
      },{
        id: 'social-rss',
        title: 'RSS Feed',
        section: 'Socials',
        handler: () => {
          window.open("/feed.xml", "_blank");
        },
      },{
      id: 'light-theme',
      title: 'Change theme to light',
      description: 'Change the theme of the site to Light',
      section: 'Theme',
      handler: () => {
        setThemeSetting("light");
      },
    },
    {
      id: 'dark-theme',
      title: 'Change theme to dark',
      description: 'Change the theme of the site to Dark',
      section: 'Theme',
      handler: () => {
        setThemeSetting("dark");
      },
    },
    {
      id: 'system-theme',
      title: 'Use system default theme',
      description: 'Change the theme of the site to System Default',
      section: 'Theme',
      handler: () => {
        setThemeSetting("system");
      },
    },];
