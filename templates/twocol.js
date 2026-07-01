window.TPL = window.TPL || {};
window.TPL.twocol = (r) => `
    <div class="tpl-twocol">
      <aside class="side">
        <h1>${escapeHtml(r.name)}</h1>
        <div class="role">${escapeHtml(r.title)}</div>
        <div class="sec"><div class="sec-h">Contact</div>
          ${r.email ? `<div class="contact-row"><i class="fa-solid fa-envelope"></i>${escapeHtml(r.email)}</div>` : ''}
          ${r.phone ? `<div class="contact-row"><i class="fa-solid fa-phone"></i>${escapeHtml(r.phone)}</div>` : ''}
          ${r.location ? `<div class="contact-row"><i class="fa-solid fa-location-dot"></i>${escapeHtml(r.location)}</div>` : ''}
          ${r.website ? `<div class="contact-row"><i class="fa-solid fa-globe"></i>${escapeHtml(r.website)}</div>` : ''}
          ${r.linkedin ? `<div class="contact-row"><i class="fa-brands fa-linkedin"></i>${escapeHtml(r.linkedin)}</div>` : ''}
          ${r.github ? `<div class="contact-row"><i class="fa-brands fa-github"></i>${escapeHtml(r.github)}</div>` : ''}
        </div>
        ${skillsArray(r).length ? `<div class="sec"><div class="sec-h">Skills</div><div style="font-size:9.5pt;line-height:1.6">${skillsArray(r).map(s => escapeHtml(s)).join('<br>')}</div></div>` : ''}
        ${certsLines(r).length ? `<div class="sec"><div class="sec-h">Certifications</div><div style="font-size:9.5pt">${certsLines(r).map(c => escapeHtml(c)).join('<br>')}</div></div>` : ''}
        ${r.languages ? `<div class="sec"><div class="sec-h">Languages</div><div style="font-size:9.5pt">${escapeHtml(r.languages)}</div></div>` : ''}
      </aside>
      <div class="main">
        ${r.summary ? `<div class="sec"><div class="sec-h">Profile</div>${escapeHtml(r.summary)}</div>` : ''}
        ${r.experience && r.experience.length ? `<div class="sec"><div class="sec-h">Experience</div>${r.experience.map(e => `
          <div class="exp">
            <div class="exp-h"><div class="exp-title">${escapeHtml(e.role)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div>
            <div class="exp-meta">${escapeHtml(e.company)}${e.location ? ' · ' + escapeHtml(e.location) : ''}</div>
            ${bulletsHtml(e.bullets)}
          </div>`).join('')}</div>` : ''}
        ${r.education && r.education.length ? `<div class="sec"><div class="sec-h">Education</div>${r.education.map(e => `<div class="exp"><div class="exp-h"><div class="exp-title">${escapeHtml(e.school)}</div><div class="exp-date">${escapeHtml(e.from)} – ${escapeHtml(e.to)}</div></div><div class="exp-meta">${escapeHtml(e.degree)}</div>${e.notes ? `<div>${escapeHtml(e.notes)}</div>` : ''}</div>`).join('')}</div>` : ''}
        ${r.projects && r.projects.length ? `<div class="sec"><div class="sec-h">Projects</div>${r.projects.map(p => `<div class="exp"><div class="exp-title">${escapeHtml(p.name)}</div><div>${escapeHtml(p.desc || '')}</div></div>`).join('')}</div>` : ''}
      </div>
    </div>`;
