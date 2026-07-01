window.TPL = window.TPL || {};
window.TPL.elegant = (r) => `
    <div class="tpl-elegant">
      <div class="header">
        <h1>${escapeHtml(r.name)}</h1>
        <div class="role">${escapeHtml(r.title)}</div>
        <div class="contact">${contactHtml(r, {plain: true})}</div>
      </div>
      ${r.summary ? `<div class="sec"><div class="sec-h">Profile</div><div style="text-align:center">${escapeHtml(r.summary)}</div></div>` : ''}
      ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">Experience</div>${r.experience.map(e => `
        <div class="exp">
          <div class="exp-h"><div class="exp-title">${escapeHtml(e.role)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
          <div class="exp-meta">${escapeHtml(e.company)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
          ${bulletsHtml(e.bullets)}
        </div>`).join('')}</div>` : ''}
      ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">Education</div>${r.education.map(e => `<div class="exp"><div class="exp-h"><div class="exp-title">${escapeHtml(e.school)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div><div class="exp-meta">${escapeHtml(e.degree)}</div></div>`).join('')}</div>` : ''}
      ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">Skills</div><div style="text-align:center">${skillsArray(r).map(s => escapeHtml(s)).join(' · ')}</div></div>` : ''}
      ${certsLines(r).length ? `<div class="sec"><div class="sec-h">Certifications</div><div style="text-align:center">${certsLines(r).map(c => escapeHtml(c)).join(' · ')}</div></div>` : ''}
      ${r.languages ? `<div class="sec"><div class="sec-h">Languages</div><div style="text-align:center">${escapeHtml(r.languages)}</div></div>` : ''}
    </div>`;
