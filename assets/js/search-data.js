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
        },{id: "nav-sentiment",
          title: "sentiment",
          description: "실시간 개미 동향 — Reddit · StockTwits · Bluesky · 4chan · HN을 30분 cron으로 크롤링해 종목 멘션·감성·이상치를 종합 분석합니다.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/sentiment/";
          },
        },{id: "nav-options",
          title: "options",
          description: "실전 옵션 데스크 — 딜러 GEX/Vanna/Charm, IV 표면, term structure, VRP, max-pain. 15분 cron으로 갱신.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/options/";
          },
        },{id: "nav-portfolio",
          title: "portfolio",
          description: "개인 투자 포트폴리오 스냅샷 · 자산군별 배분 · 종목별 P&amp;L. Yahoo Finance 15분 cron.",
          section: "Navigation",
          handler: () => {
            window.location.href = "/portfolio/";
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
        },{id: "post-매매-복기-2026-04-28-nq-인내심-그리고-불타기의-미학",
        
          title: "매매 복기 | 2026-04-28 NQ — 인내심, 그리고 불타기의 미학",
        
        description: "박스권 이탈 실수를 빠르게 인정하고, 의도된 Liquidity Sweep 이후 FVG 진입 — micro 5계약 피라미딩으로 +$368.44",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/04/28/trading-journal/";
          
        },
      },{id: "post-매매-복기-2026-04-25-nq-정해진-손익-그리고-꾸준함",
        
          title: "매매 복기 | 2026-04-25 NQ — 정해진 손익, 그리고 꾸준함",
        
        description: "진입점과 청산 지점을 모두 표시한 복기. 손실도 수익도 정해진 대로 볼 줄 아는 것, 그리고 clear한 기준으로 들어가는 것",
        section: "Posts",
        handler: () => {
          
            window.location.href = "/blog/2026/04/25/trading-journal/";
          
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
      },{
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
