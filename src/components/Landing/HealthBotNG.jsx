import React, { useState, useEffect } from "react";

const COLORS = {
  green50: "#E8F5EE",
  green100: "#C3E8D0",
  green400: "#2A9E6A",
  green600: "#0F7A50",
  green800: "#065035",
  green900: "#03301F",
  amber50: "#FAEEDA",
  amber100: "#FAC775",
  amber600: "#854F0B",
  amber800: "#633806",
  textPrimary: "#111210",
  textSecondary: "#4B5250",
  textMuted: "#8A938F",
  border: "rgba(0,0,0,0.08)",
  borderStrong: "rgba(0,0,0,0.14)",
  bgPage: "#F7F8F6",
  bgCard: "#FFFFFF",
  bgSubtle: "#F0F2EF",
};

const styles = {
  // Global
  body: {
    fontFamily: "'DM Sans', sans-serif",
    background: COLORS.bgPage,
    color: COLORS.textPrimary,
    fontSize: 16,
    lineHeight: 1.6,
    WebkitFontSmoothing: "antialiased",
    margin: 0,
    padding: 0,
  },

  // Nav
  nav: {
    position: "sticky",
    top: 0,
    zIndex: 100,
    background: "rgba(247,248,246,0.88)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderBottom: `0.5px solid ${COLORS.border}`,
    padding: "0 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    height: 60,
  },
  navBrand: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    textDecoration: "none",
    color: COLORS.textPrimary,
  },
  navLogo: {
    width: 32,
    height: 32,
    background: COLORS.green600,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  navLogoIcon: { fontSize: 17, color: "#fff" },
  navName: { fontSize: 15, fontWeight: 500, letterSpacing: "-0.01em" },
  navLinks: { display: "flex", alignItems: "center", gap: "1.5rem" },
  navLink: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecoration: "none",
    transition: "color 0.15s",
  },
  navCta: {
    background: COLORS.green600,
    color: "#fff",
    padding: "8px 18px",
    borderRadius: 10,
    fontWeight: 500,
    textDecoration: "none",
    fontSize: 14,
    transition: "background 0.15s",
  },

  // Hero
  heroWrapper: {
    padding: "5rem 2rem 4rem",
    textAlign: "center",
    maxWidth: 760,
    margin: "0 auto",
  },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    gap: 6,
    background: COLORS.green50,
    color: COLORS.green800,
    fontSize: 12,
    fontWeight: 500,
    padding: "5px 14px",
    borderRadius: 99,
    marginBottom: "2rem",
    border: `0.5px solid ${COLORS.green100}`,
    letterSpacing: "0.02em",
  },
  h1: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(36px, 5vw, 56px)",
    fontWeight: 400,
    lineHeight: 1.1,
    letterSpacing: "-0.02em",
    marginBottom: "1.25rem",
    color: COLORS.textPrimary,
  },
  h1Em: { fontStyle: "italic", color: COLORS.green600 },
  heroP: {
    fontSize: 17,
    color: COLORS.textSecondary,
    maxWidth: 500,
    margin: "0 auto 2.5rem",
    lineHeight: 1.75,
  },
  heroCta: {
    display: "flex",
    gap: 12,
    justifyContent: "center",
    flexWrap: "wrap",
    marginBottom: "4rem",
  },
  btnPrimary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: COLORS.green600,
    color: "#fff",
    padding: "13px 26px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    textDecoration: "none",
    transition: "background 0.15s, transform 0.1s",
    fontFamily: "'DM Sans', sans-serif",
    border: "none",
    cursor: "pointer",
  },
  btnSecondary: {
    display: "inline-flex",
    alignItems: "center",
    gap: 8,
    background: COLORS.bgCard,
    color: COLORS.textPrimary,
    padding: "13px 26px",
    borderRadius: 10,
    fontSize: 15,
    fontWeight: 500,
    textDecoration: "none",
    border: `0.5px solid ${COLORS.borderStrong}`,
    transition: "background 0.15s, transform 0.1s",
    fontFamily: "'DM Sans', sans-serif",
    cursor: "pointer",
  },

  // Chat preview
  chatPreview: {
    maxWidth: 540,
    margin: "0 auto",
    background: COLORS.bgCard,
    border: `0.5px solid ${COLORS.borderStrong}`,
    borderRadius: 24,
    padding: "1.5rem",
    textAlign: "left",
    boxShadow: "0 2px 20px rgba(0,0,0,0.06)",
  },
  chatHeader: {
    display: "flex",
    alignItems: "center",
    gap: 10,
    marginBottom: "1.25rem",
    paddingBottom: "1rem",
    borderBottom: `0.5px solid ${COLORS.border}`,
  },
  chatAvatar: {
    width: 36,
    height: 36,
    borderRadius: "50%",
    background: COLORS.green600,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  chatInfoName: { fontSize: 14, fontWeight: 500 },
  chatInfoStatus: {
    fontSize: 12,
    color: COLORS.green600,
    display: "flex",
    alignItems: "center",
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: "50%",
    background: COLORS.green400,
  },
  msgRow: {
    display: "flex",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  msgRowUser: {
    display: "flex",
    flexDirection: "row-reverse",
    gap: 10,
    marginBottom: 10,
    alignItems: "flex-end",
  },
  msgBubbleBot: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: 16,
    borderBottomLeftRadius: 4,
    fontSize: 13.5,
    lineHeight: 1.55,
    background: COLORS.bgSubtle,
    color: COLORS.textPrimary,
  },
  msgBubbleUser: {
    maxWidth: "78%",
    padding: "10px 14px",
    borderRadius: 16,
    borderBottomRightRadius: 4,
    fontSize: 13.5,
    lineHeight: 1.55,
    background: COLORS.green600,
    color: "#fff",
  },
  msgAvatarSm: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: COLORS.green50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 500,
    color: COLORS.green800,
    flexShrink: 0,
  },
  msgAvatarSmUser: {
    width: 26,
    height: 26,
    borderRadius: "50%",
    background: COLORS.green100,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 11,
    fontWeight: 500,
    color: COLORS.green900,
    flexShrink: 0,
  },

  // Stats
  statsBar: {
    borderTop: `0.5px solid ${COLORS.border}`,
    borderBottom: `0.5px solid ${COLORS.border}`,
    background: COLORS.bgCard,
  },
  statsInner: {
    maxWidth: 800,
    margin: "0 auto",
    display: "grid",
    gridTemplateColumns: "repeat(4, 1fr)",
    padding: "0 2rem",
  },
  statItem: {
    padding: "2rem 1rem",
    textAlign: "center",
    borderRight: `0.5px solid ${COLORS.border}`,
  },
  statItemLast: {
    padding: "2rem 1rem",
    textAlign: "center",
  },
  statNum: {
    fontSize: 28,
    fontWeight: 500,
    color: COLORS.green600,
    letterSpacing: "-0.02em",
  },
  statLabel: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  // Section
  section: {
    maxWidth: 800,
    margin: "0 auto",
    padding: "4rem 2rem",
    borderTop: `0.5px solid ${COLORS.border}`,
  },
  sectionEyebrow: {
    fontSize: 11,
    fontWeight: 500,
    letterSpacing: "0.1em",
    textTransform: "uppercase",
    color: COLORS.green600,
    marginBottom: "0.75rem",
  },
  sectionH2: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(24px, 3vw, 32px)",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    marginBottom: "0.75rem",
    lineHeight: 1.25,
  },
  sectionP: {
    fontSize: 16,
    color: COLORS.textSecondary,
    maxWidth: 520,
    lineHeight: 1.75,
    marginBottom: 0,
  },

  // Features
  featuresGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: 12,
    marginTop: "2.5rem",
  },
  featureCard: {
    background: COLORS.bgCard,
    border: `0.5px solid ${COLORS.border}`,
    borderRadius: 16,
    padding: "1.5rem",
    transition: "border-color 0.15s, transform 0.15s",
    cursor: "default",
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    background: COLORS.green50,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: "1rem",
  },
  featureIconI: { fontSize: 20, color: COLORS.green600 },
  featureH3: { fontSize: 14, fontWeight: 500, marginBottom: 6 },
  featureP: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.65 },

  // Steps
  steps: {
    marginTop: "2.5rem",
    display: "flex",
    flexDirection: "column",
    gap: 0,
  },
  step: {
    display: "flex",
    gap: "1.25rem",
    padding: "1.5rem 0",
    borderBottom: `0.5px solid ${COLORS.border}`,
  },
  stepLast: {
    display: "flex",
    gap: "1.25rem",
    padding: "1.5rem 0",
  },
  stepNum: {
    width: 34,
    height: 34,
    borderRadius: "50%",
    background: COLORS.green50,
    color: COLORS.green800,
    fontSize: 13,
    fontWeight: 500,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    border: `0.5px solid ${COLORS.green100}`,
  },
  stepTitle: { fontSize: 15, fontWeight: 500, marginBottom: 5 },
  stepDesc: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 1.65 },

  // Use cases
  useCaseGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
    gap: 12,
    marginTop: "2.5rem",
  },
  useCaseCard: {
    background: COLORS.bgSubtle,
    borderRadius: 10,
    padding: "1.25rem",
  },
  useCaseIcon: {
    fontSize: 22,
    color: COLORS.green600,
    marginBottom: 10,
    display: "block",
  },
  useCaseH3: { fontSize: 14, fontWeight: 500, marginBottom: 5 },
  useCaseP: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 1.6 },

  // Disclaimer
  disclaimerWrap: { maxWidth: 800, margin: "0 auto", padding: "0 2rem 3rem" },
  disclaimerBox: {
    background: COLORS.amber50,
    border: `0.5px solid ${COLORS.amber100}`,
    borderRadius: 10,
    padding: "1rem 1.25rem",
    display: "flex",
    gap: 12,
    alignItems: "flex-start",
  },
  disclaimerIcon: {
    fontSize: 18,
    color: COLORS.amber600,
    flexShrink: 0,
    marginTop: 2,
  },
  disclaimerP: {
    fontSize: 13,
    color: COLORS.amber800,
    lineHeight: 1.65,
    margin: 0,
  },

  // CTA band
  ctaBand: {
    borderTop: `0.5px solid ${COLORS.border}`,
    background: COLORS.bgCard,
    padding: "5rem 2rem",
    textAlign: "center",
  },
  ctaH2: {
    fontFamily: "'DM Serif Display', serif",
    fontSize: "clamp(28px, 4vw, 40px)",
    fontWeight: 400,
    letterSpacing: "-0.02em",
    marginBottom: "0.75rem",
  },
  ctaP: { fontSize: 16, color: COLORS.textSecondary, marginBottom: "2rem" },

  // Footer
  footer: {
    borderTop: `0.5px solid ${COLORS.border}`,
    padding: "1.5rem 2rem",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    flexWrap: "wrap",
    gap: 12,
    background: COLORS.bgPage,
  },
  footerBrand: {
    display: "flex",
    alignItems: "center",
    gap: 8,
    textDecoration: "none",
    color: COLORS.textPrimary,
  },
  footerLogo: {
    width: 26,
    height: 26,
    background: COLORS.green600,
    borderRadius: 6,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  footerName: { fontSize: 14, fontWeight: 500 },
  footerLinks: { display: "flex", gap: "1.5rem" },
  footerLink: { fontSize: 13, color: COLORS.textMuted, textDecoration: "none" },
  footerCopy: { fontSize: 12, color: COLORS.textMuted },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function GoogleFonts() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;1,9..40,400&family=DM+Serif+Display:ital@0;1&display=swap');
      @import url('https://cdn.jsdelivr.net/npm/@tabler/icons-webfont@latest/dist/tabler-icons.min.css');

      * { box-sizing: border-box; margin: 0; padding: 0; }
      body { font-family: 'DM Sans', sans-serif; overflow: auto }

      @keyframes fadeUp {
        from { opacity: 0; transform: translateY(16px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .fade-1 { animation: fadeUp 0.4s 0.0s ease both; }
      .fade-2 { animation: fadeUp 0.4s 0.1s ease both; }
      .fade-3 { animation: fadeUp 0.4s 0.2s ease both; }
      .fade-4 { animation: fadeUp 0.4s 0.3s ease both; }
      .fade-5 { animation: fadeUp 0.4s 0.4s ease both; }

      .feature-card:hover { border-color: rgba(0,0,0,0.18) !important; transform: translateY(-2px); }
      .btn-primary:hover  { background: #065035 !important; transform: translateY(-1px); }
      .btn-secondary:hover { background: #F0F2EF !important; transform: translateY(-1px); }
      .nav-link:hover { color: #111210 !important; }

      .nav-link { 
        @media (max-width: 650px) {
          display: none;
       }
      }

    `}</style>
  );
}

function Nav() {
  return (
    <nav style={styles.nav}>
      <a href="/" style={styles.navBrand}>
        <div style={styles.navLogo}>
          <i className="ti ti-activity-heartbeat" style={styles.navLogoIcon} />
        </div>
        <span style={styles.navName}>HealthBot NG</span>
      </a>
      <div style={styles.navLinks}>
        {/* <a href="#features" className="nav-link" style={styles.navLink}>
          Features
        </a>
        <a href="#how-it-works" className="nav-link" style={styles.navLink}>
          How it works
        </a>
        <a href="#who-it-helps" className="nav-link" style={styles.navLink}>
          Who it helps
        </a> */}
        <a
          href="https://github.com/Aybee5/rag-nigeria-clinical-guidelines-dataset"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-link"
          style={styles.navLink}
        >
          GitHub
        </a>
        <a href="/app" rel="noopener noreferrer" style={styles.navCta}>
          Try it free
        </a>
      </div>
    </nav>
  );
}

function ChatPreview() {
  const messages = [
    {
      role: "user",
      text: "What are the first-line treatments for malaria in adults?",
    },
    {
      role: "bot",
      text: "According to the NSTG 2022, the first-line treatment for uncomplicated malaria in adults is Artemether-Lumefantrine (AL) — 4 tablets twice daily for 3 days, taken with food to improve absorption.",
    },
    { role: "user", text: "What about severe malaria?" },
    {
      role: "bot",
      text: "For severe malaria, IV Artesunate is the drug of choice. Quinine IV is the alternative where artesunate is unavailable. Supportive care including fluid management is also recommended.",
    },
  ];

  return (
    <div style={styles.chatPreview}>
      <div style={styles.chatHeader}>
        <div style={styles.chatAvatar}>
          <i
            className="ti ti-activity-heartbeat"
            style={{ fontSize: 18, color: "#fff" }}
          />
        </div>
        <div>
          <div style={styles.chatInfoName}>HealthBot NG</div>
          <div style={styles.chatInfoStatus}>
            <span style={styles.statusDot} />
            Online · NSTG 2022
          </div>
        </div>
      </div>

      {messages.map((m, i) => (
        <div
          key={i}
          style={m.role === "user" ? styles.msgRowUser : styles.msgRow}
        >
          <div
            style={
              m.role === "user" ? styles.msgAvatarSmUser : styles.msgAvatarSm
            }
          >
            {m.role === "user" ? "U" : "H"}
          </div>
          <div
            style={
              m.role === "user" ? styles.msgBubbleUser : styles.msgBubbleBot
            }
          >
            {m.text}
          </div>
        </div>
      ))}
    </div>
  );
}

function Hero() {
  return (
    <section style={styles.heroWrapper}>
      <div className="fade-1" style={styles.badge}>
        <i className="ti ti-shield-check" />
        Based on NSTG 2022
      </div>
      <h1 className="fade-2" style={styles.h1}>
        Your AI guide to{" "}
        <em style={styles.h1Em}>Nigerian clinical guidelines</em>
      </h1>
      <p className="fade-3" style={styles.heroP}>
        Ask questions about symptoms, treatments, and medications — grounded in
        the Nigeria Standard Treatment Guidelines (NSTG) 2022, covering 270
        clinical conditions.
      </p>
      <div className="fade-4" style={styles.heroCta}>
        <a
          href="/app"
          rel="noopener noreferrer"
          className="btn-primary"
          style={styles.btnPrimary}
        >
          <i className="ti ti-message-circle" />
          Try HealthBot NG
        </a>
        <a
          href="https://github.com/Aybee5/rag-nigeria-clinical-guidelines-dataset"
          target="_blank"
          rel="noopener noreferrer"
          className="btn-secondary"
          style={styles.btnSecondary}
        >
          <i className="ti ti-brand-github" />
          View on GitHub
        </a>
      </div>
      <div className="fade-5">
        <ChatPreview />
      </div>
    </section>
  );
}

function StatsBar() {
  const stats = [
    { num: "270", label: "Clinical conditions" },
    { num: "NSTG 2022", label: "Official guideline source" },
    { num: "RAG", label: "AI-powered retrieval" },
    { num: "Free", label: "Open access" },
  ];
  return (
    <div style={styles.statsBar}>
      <div style={styles.statsInner}>
        {stats.map((s, i) => (
          <div
            key={i}
            style={i < stats.length - 1 ? styles.statItem : styles.statItemLast}
          >
            <div style={styles.statNum}>{s.num}</div>
            <div style={styles.statLabel}>{s.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Features() {
  const items = [
    {
      icon: "ti-search",
      title: "Guideline-grounded answers",
      desc: "Every response is retrieved from the structured NSTG 2022 dataset — not hallucinated from the internet.",
    },
    {
      icon: "ti-pill",
      title: "Drug & dosage lookup",
      desc: "Get first-line treatments, dosing protocols, and drug cautions for any condition in the guidelines.",
    },
    {
      icon: "ti-stethoscope",
      title: "Differential diagnosis help",
      desc: "Explore differential diagnoses, clinical features, and investigative workups across conditions.",
    },
    {
      icon: "ti-map-pin",
      title: "Locally relevant",
      desc: "Tailored for Nigeria — drug availability, local disease burden",
    },
  ];
  return (
    <section id="features" style={styles.section}>
      <div style={styles.sectionEyebrow}>What it does</div>
      <h2 style={styles.sectionH2}>
        Clinical answers grounded in Nigerian guidelines
      </h2>
      <p style={styles.sectionP}>
        HealthBot NG uses retrieval-augmented generation to pull accurate,
        referenced answers from the official NSTG 2022 — not generic internet
        content.
      </p>
      <div style={styles.featuresGrid}>
        {items.map((f, i) => (
          <div key={i} className="feature-card" style={styles.featureCard}>
            <div style={styles.featureIcon}>
              <i className={`ti ${f.icon}`} style={styles.featureIconI} />
            </div>
            <h3 style={styles.featureH3}>{f.title}</h3>
            <p style={styles.featureP}>{f.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      title: "You ask a clinical question",
      desc: "Type any question about symptoms, diagnoses, treatments, or medications in plain, everyday language.",
    },
    {
      title: "Relevant guidelines are retrieved",
      desc: "The system searches 270 structured condition profiles from the NSTG 2022 for the most relevant content using semantic search.",
    },
    {
      title: "An AI generates a grounded response",
      desc: "A large language model synthesises the retrieved content into a clear, referenced answer — no guesswork, no hallucination.",
    },
  ];
  return (
    <section id="how-it-works" style={styles.section}>
      <div style={styles.sectionEyebrow}>How it works</div>
      <h2 style={styles.sectionH2}>Simple, fast, and accurate</h2>
      <p style={styles.sectionP}>
        HealthBot NG combines a structured clinical dataset with a modern RAG
        pipeline to deliver referenced answers in seconds.
      </p>
      <div style={styles.steps}>
        {steps.map((s, i) => (
          <div
            key={i}
            style={i < steps.length - 1 ? styles.step : styles.stepLast}
          >
            <div style={styles.stepNum}>{i + 1}</div>
            <div>
              <div style={styles.stepTitle}>{s.title}</div>
              <div style={styles.stepDesc}>{s.desc}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function WhoItHelps() {
  const cards = [
    {
      icon: "ti-books",
      title: "Medical students",
      desc: "Study clinical conditions with NSTG-aligned content for Nigerian medical exams and clinical rotations.",
    },
    {
      icon: "ti-heart-rate-monitor",
      title: "Community health workers",
      desc: "A quick, accessible reference for frontline care decisions in the field.",
    },
    {
      icon: "ti-user",
      title: "Patients & families",
      desc: "Understand diagnoses, treatment options, and what to expect from the healthcare system.",
    },
    {
      icon: "ti-code",
      title: "Developers & researchers",
      desc: "Explore the open dataset and RAG pipeline for health AI and NLP research in Nigeria.",
    },
  ];
  return (
    <section id="who-it-helps" style={styles.section}>
      <div style={styles.sectionEyebrow}>Who it helps</div>
      <h2 style={styles.sectionH2}>
        Built for anyone seeking clinical clarity
      </h2>
      <p style={styles.sectionP}>
        Whether you are a student, a community health worker, or a curious
        citizen — HealthBot NG gives you reliable, locally grounded health
        information.
      </p>
      <div style={styles.useCaseGrid}>
        {cards.map((c, i) => (
          <div key={i} style={styles.useCaseCard}>
            <i className={`ti ${c.icon}`} style={styles.useCaseIcon} />
            <h3 style={styles.useCaseH3}>{c.title}</h3>
            <p style={styles.useCaseP}>{c.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function Disclaimer() {
  return (
    <div style={styles.disclaimerWrap}>
      <div style={styles.disclaimerBox}>
        <i className="ti ti-alert-triangle" style={styles.disclaimerIcon} />
        <p style={styles.disclaimerP}>
          <strong>Medical disclaimer:</strong> HealthBot NG is an informational
          tool only and does not constitute medical advice. Always consult a
          qualified healthcare professional for diagnosis and treatment
          decisions. In an emergency, contact your nearest hospital immediately.
        </p>
      </div>
    </div>
  );
}

function CTABand() {
  return (
    <div style={styles.ctaBand}>
      <h2 style={styles.ctaH2}>Ready to get started?</h2>
      <p style={styles.ctaP}>
        Ask your first clinical question — free, no account required.
      </p>
      <a
        href="/app"
        rel="noopener noreferrer"
        className="btn-primary"
        style={{
          ...styles.btnPrimary,
          margin: "0 auto",
          display: "inline-flex",
        }}
      >
        <i className="ti ti-message-circle" />
        Open HealthBot NG
      </a>
    </div>
  );
}

function Footer() {
  return (
    <footer style={styles.footer}>
      <a href="/" style={styles.footerBrand}>
        <div style={styles.footerLogo}>
          <i
            className="ti ti-activity-heartbeat"
            style={{ fontSize: 14, color: "#fff" }}
          />
        </div>
        <span style={styles.footerName}>HealthBot NG</span>
      </a>
      <div style={styles.footerLinks}>
        <a href="/app" rel="noopener noreferrer" style={styles.footerLink}>
          Try the app
        </a>
        <a
          href="https://github.com/Aybee5/rag-nigeria-clinical-guidelines-dataset"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          GitHub
        </a>
        <a
          href="https://github.com/chisomrutherford/nigeria-clinical-guidelines-dataset"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          Dataset (CC BY 4.0)
        </a>
      </div>
      <div style={styles.footerCopy}>
        <a
          href="https://github.com/chisomrutherford/nigeria-clinical-guidelines-dataset"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.footerLink}
        >
          Data source: NSTG 2022
        </a>
      </div>
    </footer>
  );
}

// ─── SEO Head (for use with React Helmet or Next.js Head) ─────────────────────
export function SEOHead() {
  return (
    <>
      <title>HealthBot NG — AI Clinical Assistant for Nigeria</title>
      <meta
        name="description"
        content="Ask questions about symptoms, treatments, and medications — grounded in the Nigeria Standard Treatment Guidelines (NSTG) 2022. Covering 270 clinical conditions."
      />
      <meta
        name="keywords"
        content="Nigeria health, clinical guidelines, NSTG 2022, AI health assistant, Nigeria Standard Treatment Guidelines, medical chatbot Nigeria, RAG clinical AI"
      />
      <meta name="author" content="HealthBot NG" />
      <meta name="robots" content="index, follow" />
      <link rel="canonical" href="https://healthbot.com.ng/" />
      <meta property="og:type" content="website" />
      <meta property="og:url" content="https://healthbot.com.ng/" />
      <meta
        property="og:title"
        content="HealthBot NG — AI Clinical Assistant for Nigeria"
      />
      <meta
        property="og:description"
        content="Ask questions about symptoms, treatments, and medications — grounded in the Nigeria Standard Treatment Guidelines (NSTG) 2022."
      />
      <meta
        property="og:image"
        content="https://healthbot.com.ng/og-image.png"
      />
      <meta property="og:locale" content="en_NG" />
      <meta property="og:site_name" content="HealthBot NG" />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:url" content="https://healthbot.com.ng/" />
      <meta
        name="twitter:title"
        content="HealthBot NG — AI Clinical Assistant for Nigeria"
      />
      <meta
        name="twitter:description"
        content="Ask questions about symptoms, treatments, and medications — grounded in the NSTG 2022."
      />
      <meta
        name="twitter:image"
        content="https://healthbot.com.ng/og-image.png"
      />
      <meta name="geo.region" content="NG" />
      <meta name="geo.placename" content="Nigeria" />
    </>
  );
}

// ─── Main export ──────────────────────────────────────────────────────────────
export default function HealthBotNGLanding() {
  return (
    <div style={styles.body}>
      <GoogleFonts />
      <Nav />
      <Hero />
      <StatsBar />
      <Features />
      <HowItWorks />
      <WhoItHelps />
      <Disclaimer />
      <CTABand />
      <Footer />
    </div>
  );
}
