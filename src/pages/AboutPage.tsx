const TEAM = [
  { name: 'Mahrah Ahmed Hassan Saeed Alyammahi', initials: 'MA', colour: '#b8862b' },
  { name: 'Afraa Mohammed Alawi Hadi Al Hamed', initials: 'AA', colour: '#a4502f' },
  { name: 'Hajar Hashim Mohamed Sharif Alsaqqaf', initials: 'HA', colour: '#2f6b55' },
  { name: 'Salama Ali Saeed Kardous Alhadhrami', initials: 'SA', colour: '#23466b' },
]

const OBJECTIVES = [
  'Create an interactive website about ancient civilizations.',
  'Allow users to select different civilizations.',
  'Display reconstructed historical environments.',
  'Provide educational information about each civilization.',
  'Use technology and AI to improve learning experiences.',
]

const SYSTEM_FLOW = [
  'Access web platform',
  'Select civilization',
  'Retrieve historical data',
  'Process with reconstruction algorithms',
  'Generate 3D city layout',
  'Display interactive environment',
  'Explore in VR',
  'Show historical facts',
  'Save / exit session',
]

const AI_FLOW = [
  'Upload photo',
  'Choose manual or auto mode',
  'Estimate the price',
  'Detect the damage',
  'Rebuild the surface',
  'Display & download',
]

const TECHNOLOGIES = [
  'React',
  'TypeScript',
  'Vite',
  'WebGL 3D rendering',
  'WebXR virtual reality',
  'Serverless AI image editing',
  'Canvas image processing',
  'Sketchfab photogrammetry',
]

export default function AboutPage() {
  return (
    <div className="container">
      <div className="page-head">
        <span className="eyebrow">Capstone project</span>
        <h1>About the Project</h1>
        <p className="lead">
          Ancient Civilization Reconstructor combines history, technology and artificial
          intelligence to create an engaging educational experience that helps users understand
          ancient civilizations through interactive visual reconstructions.
        </p>
      </div>

      <div className="about-grid" style={{ paddingBottom: 64 }}>
        <div>
          <section className="panel">
            <h3>Project objectives</h3>
            <ul className="checklist">
              {OBJECTIVES.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3>How the system works</h3>
            <ol className="flow">
              {SYSTEM_FLOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <h3 style={{ marginTop: 24 }}>AI artifact reconstruction</h3>
            <ol className="flow">
              {AI_FLOW.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>

            <p className="muted" style={{ margin: '16px 0 0', fontSize: '.92rem' }}>
              The restorer runs on a serverless function so the API key never reaches the browser.
              It supports a manual brush mode and an automatic mode, always shows a price estimate
              before generating, and falls back to a basic local repair when the AI call fails.
            </p>
          </section>

          <section className="panel">
            <h3>Technologies</h3>
            <div className="tech">
              {TECHNOLOGIES.map((tech) => (
                <span key={tech}>{tech}</span>
              ))}
            </div>
          </section>
        </div>

        <div>
          <figure className="about-logo">
            <img src="/logo/logo-banner.jpg" alt="ACR — Ancient Civilization Reconstructor logo" />
          </figure>

          <section className="panel">
            <h3>Project details</h3>
            <table className="info-table">
              <tbody>
                <tr>
                  <th>Cluster</th>
                  <td>Computing and Artificial Intelligence</td>
                </tr>
                <tr>
                  <th>Campus</th>
                  <td>Baniyas — Girls</td>
                </tr>
                <tr>
                  <th>Supervisor</th>
                  <td>Ms. Ashjan Saleh</td>
                </tr>
                <tr>
                  <th>Civilizations</th>
                  <td>
                    Ancient Egypt, Ancient Rome, the Maya, the Taj Mahal, Petra and three UAE
                    heritage sites
                  </td>
                </tr>
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h3>Project team</h3>
            <ul className="team">
              {TEAM.map((member) => (
                <li key={member.name}>
                  <span className="avatar" style={{ background: member.colour }}>
                    {member.initials}
                  </span>
                  <span>{member.name}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="panel">
            <h3>Sources</h3>
            <p className="muted" style={{ margin: 0, fontSize: '.92rem' }}>
              Historical content is based on reliable educational sources, UNESCO and national
              heritage publications, museum archives and research articles. 3D scenes are simplified
              reconstructions based on the documented layout and proportions of the real monuments,
              and photogrammetry models are the property of their creators on Sketchfab.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
