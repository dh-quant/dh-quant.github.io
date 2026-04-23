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
        },{id: "nav-markets",
          title: "markets",
          description: "실시간 글로벌 시황 · 섹터 · 채권 · 원자재 · FX · 크립토. 15분 cron으로 데이터 갱신.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/markets/";
          },
        },{id: "nav-portfolio",
          title: "portfolio",
          description: "개인 투자 포트폴리오 스냅샷 · 자산군별 배분 · 종목별 P&amp;L. 수동 갱신.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/portfolio/";
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
        },{id: "nav-physics",
          title: "physics",
          description: "인터랙티브 물리 시뮬레이션 — 전자기학 · 양자역학 · 역학 · 파동. 실제 지배방정식을 그대로 수치 적분합니다.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/physics/";
          },
        },{id: "post-매매-복기-2026-04-23-nq-수렴-끝의-스윕-ict-2022-모델대로",
        
          title: "매매 복기 | 2026-04-23 NQ — 수렴 끝의 스윕, ICT 2022 모델대로",
        
        description: "거래량 수렴 → 유동성 스윕 확인 → 다음 스윙 포인트에서 전량 정리. ICT 2022 모델 기반 짧은 매매",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/04/23/trading-journal/";
          
        },
      },{id: "post-매매-복기-2026-04-21-nq-스윕-없는-수렴-그리고-멈출-줄-아는-것",
        
          title: "매매 복기 | 2026-04-21 NQ — 스윕 없는 수렴, 그리고 멈출 줄 아는...",
        
        description: "거래량 기준봉 이후 수렴 국면이 이어졌으나 유동성 스윕이 실현되지 않고 횡보 — 짧게 두 번의 매매 후 중단",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/04/20/trading-journal/";
          
        },
      },{id: "post-매매-복기-2026-04-16-nq-long",
        
          title: "매매 복기 | 2026-04-16 NQ Long",
        
        description: "거래량 수렴 구간에서의 유동성 스윕 포착 및 국지 추세 진입",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/04/16/trading-journal/";
          
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
