window.TPL = window.TPL || {};
window.TPL.exec = (r) => `
    <div class="tpl-exec">
      <div class="header">
        <h1>${escapeHtml(r.name)}</h1>
        <div class="role">${escapeHtml(r.title)}</div>
        <div class="contact">${contactHtml(r)}</div>
      </div>
      <div class="body">
        ${r.summary ? `<div class="sec"><div class="sec-h">Executive Summary</div>${escapeHtml(r.summary)}</div>` : ''}
        ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">Experience</div>${r.experience.map(e => `
          <div class="exp">
            <div class="exp-h"><div class="exp-title">${escapeHtml(e.role)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
            <div class="exp-meta">${escapeHtml(e.company)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
            ${bulletsHtml(e.bullets)}
          </div>`).join('')}</div>` : ''}
        ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">Education</div>${r.education.map(e => `<div class="exp"><div class="exp-h"><div class="exp-title">${escapeHtml(e.school)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div><div class="exp-meta">${escapeHtml(e.degree)}</div></div>`).join('')}</div>` : ''}
        ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">Core Competencies</div><div>${skillsArray(r).map(s => `<span style="display:inline-block;background:#1a1d29;color:#fff;padding:3px 10px;border-radius:3px;margin:0 4px 4px 0;font-size:9.5pt;font-weight:600">${escapeHtml(s)}</span>`).join('')}</div></div>` : ''}
        ${certsLines(r).length ? `<div class="sec"><div class="sec-h">Certifications</div>${certsLines(r).map(c => escapeHtml(c)).join(' · ')}</div>` : ''}
        ${r.languages ? `<div class="sec"><div class="sec-h">Languages</div>${escapeHtml(r.languages)}</div>` : ''}
      </div>
    </div>`;
