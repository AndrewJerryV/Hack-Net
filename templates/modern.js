window.TPL = window.TPL || {};
window.TPL.modern = (r) => `
    <div class="tpl-modern">
      <div class="header">
        <h1>${escapeHtml(r.name)}</h1>
        <div class="role">${escapeHtml(r.title)}</div>
        <div class="contact">${contactHtml(r)}</div>
      </div>
      ${r.summary ? `<div class="sec"><div class="sec-h">Summary</div><div>${escapeHtml(r.summary)}</div></div>` : ''}
      ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">Experience</div>${r.experience.map(e => `
        <div class="exp">
          <div class="exp-h"><div class="exp-title">${escapeHtml(e.role)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
          <div class="exp-meta">${escapeHtml(e.company)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
          ${bulletsHtml(e.bullets)}
        </div>`).join('')}</div>` : ''}
      ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">Education</div>${r.education.map(e => `
        <div class="exp">
          <div class="exp-h"><div class="exp-title">${escapeHtml(e.school)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
          <div class="exp-meta">${escapeHtml(e.degree)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
          ${e.notes ? `<div>${escapeHtml(e.notes)}</div>` : ''}
        </div>`).join('')}</div>` : ''}
      ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">Skills</div><div>${skillsArray(r).map(s => escapeHtml(s)).join(' · ')}</div></div>` : ''}
      ${r.projects && r.projects.length ? `<div class="sec"><div class="sec-h">Projects</div>${r.projects.map(p => `<div class="exp"><div class="exp-title">${escapeHtml(p.name)}${p.link ? ` <span style="font-weight:400;color:#0d7c66;font-size:10pt">— ${escapeHtml(p.link)}</span>` : ''}</div><div>${escapeHtml(p.desc || '')}</div></div>`).join('')}</div>` : ''}
      ${certsLines(r).length ? `<div class="sec"><div class="sec-h">Certifications</div><div>${certsLines(r).map(c => escapeHtml(c)).join(' · ')}</div></div>` : ''}
      ${r.languages ? `<div class="sec"><div class="sec-h">Languages</div><div>${escapeHtml(r.languages)}</div></div>` : ''}
    </div>`;
