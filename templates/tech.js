window.TPL = window.TPL || {};
window.TPL.tech = (r) => `
    <div class="tpl-tech">
      <h1>${escapeHtml(r.name)}</h1>
      <div class="role">${escapeHtml(r.title)}</div>
      <div class="contact">${contactHtml(r, {plain: true})}</div>
      ${r.summary ? `<div class="sec"><div class="sec-h">about_me</div>${escapeHtml(r.summary)}</div>` : ''}
      ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">tech_stack</div>${skillsArray(r).map(s => `<span class="skill-chip">${escapeHtml(s)}</span>`).join('')}</div>` : ''}
      ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">experience</div>${r.experience.map(e => `
        <div class="exp">
          <div class="exp-h"><div class="exp-title">${escapeHtml(e.role)} @ ${escapeHtml(e.company)}</div><div class="exp-date">[${escapeHtml(e.from)} → ${escapeHtml(e.to)}]</div></div>
          <div class="exp-meta">${escapeHtml(e.location || '')}</div>
          ${bulletsHtml(e.bullets)}
        </div>`).join('')}</div>` : ''}
      ${r.projects && r.projects.length ? `<div class="sec"><div class="sec-h">projects</div>${r.projects.map(p => `<div class="exp"><div class="exp-title">${escapeHtml(p.name)}${p.link ? ` <span style="font-family:'JetBrains Mono',monospace;color:#0d7c66;font-size:9.5pt">// ${escapeHtml(p.link)}</span>` : ''}</div><div>${escapeHtml(p.desc || '')}</div></div>`).join('')}</div>` : ''}
      ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">education</div>${r.education.map(e => `<div class="exp"><div class="exp-h"><div class="exp-title">${escapeHtml(e.school)}</div><div class="exp-date">[${escapeHtml(e.from)} → ${escapeHtml(e.to)}]</div></div><div class="exp-meta">${escapeHtml(e.degree)}</div></div>`).join('')}</div>` : ''}
      ${certsLines(r).length ? `<div class="sec"><div class="sec-h">certifications</div>${certsLines(r).map(c => escapeHtml(c)).join(' · ')}</div>` : ''}
    </div>`;
