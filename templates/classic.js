window.TPL = window.TPL || {};
window.TPL.classic = (r) => `
    <div class="tpl-classic">
      <h1>${escapeHtml(r.name)}</h1>
      <div class="role">${escapeHtml(r.title)}</div>
      <div class="contact">${contactHtml(r, {plain: true})}</div>
      ${r.summary ? `<div class="sec"><div class="sec-h">Summary</div>${escapeHtml(r.summary)}</div>` : ''}
      ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">Experience</div>${r.experience.map(e => `
        <div class="exp">
          <div class="exp-h"><div><span class="exp-title">${escapeHtml(e.role)}</span> — ${escapeHtml(e.company)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
          ${bulletsHtml(e.bullets)}
        </div>`).join('')}</div>` : ''}
      ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">Education</div>${r.education.map(e => `
        <div class="exp"><div class="exp-h"><div><span class="exp-title">${escapeHtml(e.school)}</span> — ${escapeHtml(e.degree)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>${e.notes ? `<div>${escapeHtml(e.notes)}</div>` : ''}</div>`).join('')}</div>` : ''}
      ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">Skills</div>${skillsArray(r).map(s => escapeHtml(s)).join(', ')}</div>` : ''}
      ${r.projects && r.projects.length ? `<div class="sec"><div class="sec-h">Projects</div>${r.projects.map(p => `<div class="exp"><div class="exp-title">${escapeHtml(p.name)}</div><div>${escapeHtml(p.desc || '')}</div></div>`).join('')}</div>` : ''}
      ${certsLines(r).length ? `<div class="sec"><div class="sec-h">Certifications</div>${certsLines(r).map(c => escapeHtml(c)).join(' · ')}</div>` : ''}
      ${r.languages ? `<div class="sec"><div class="sec-h">Languages</div>${escapeHtml(r.languages)}</div>` : ''}
    </div>`;
