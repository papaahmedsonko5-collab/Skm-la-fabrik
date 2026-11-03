// Espace admin SKM La Fabrik : petites aides d'interface, sans dépendance.
(function () {
  'use strict';

  // Ajout de plusieurs photos : envoi une par une, pour rester sous la limite
  // de taille d'une requête et afficher la progression.
  function envoyerPhotos(form) {
    var input = form.querySelector('input[type="file"]');
    var info = form.querySelector('[data-progression]');
    var files = input && input.files ? Array.prototype.slice.call(input.files) : [];
    if (!files.length) return false;
    var cat = form.querySelector('select[name="categorie"]').value;
    var btn = form.querySelector('button[type="submit"]');
    btn.setAttribute('disabled', '');
    var fait = 0;
    var erreurs = [];
    function suivant() {
      if (fait >= files.length) {
        if (erreurs.length) {
          info.textContent = erreurs.length + ' photo(s) non envoyée(s) : ' + erreurs.join(', ') + '.';
          btn.removeAttribute('disabled');
          if (erreurs.length < files.length) setTimeout(function () { window.location.href = '/admin/photos?ok=ajoute'; }, 2500);
        } else {
          window.location.href = '/admin/photos?ok=ajoute';
        }
        return;
      }
      var f = files[fait];
      info.textContent = 'Envoi ' + (fait + 1) + ' sur ' + files.length + '…';
      var fd = new FormData();
      fd.append('action', 'ajouter');
      fd.append('categorie', cat);
      fd.append('photos', f, f.name);
      fetch(form.getAttribute('action') || window.location.pathname, { method: 'POST', body: fd, headers: { 'x-envoi': 'photo' }, credentials: 'same-origin' })
        .then(function (r) { if (!r.ok) erreurs.push(f.name); })
        .catch(function () { erreurs.push(f.name); })
        .then(function () { fait++; suivant(); });
    }
    suivant();
    return true;
  }

  // Confirmation avant une action irréversible (suppression).
  document.addEventListener('submit', function (e) {
    var form = e.target;
    if (form.hasAttribute('data-envoi-photos') && window.fetch && window.FormData) {
      e.preventDefault();
      if (form.dataset.envoi !== '1' && envoyerPhotos(form)) form.dataset.envoi = '1';
      return;
    }
    var submitter = e.submitter;
    var msg = (submitter && submitter.getAttribute('data-confirm')) || form.getAttribute('data-confirm');
    if (msg && !window.confirm(msg)) {
      e.preventDefault();
      return;
    }
    // Évite les doubles envois.
    if (form.dataset.envoi === '1') {
      e.preventDefault();
      return;
    }
    form.dataset.envoi = '1';
    var btns = form.querySelectorAll('button[type="submit"]');
    for (var i = 0; i < btns.length; i++) btns[i].setAttribute('disabled', '');
    if (submitter && submitter.name) {
      // Le bouton désactivé n'est plus envoyé : on recopie sa valeur.
      var h = document.createElement('input');
      h.type = 'hidden';
      h.name = submitter.name;
      h.value = submitter.value;
      form.appendChild(h);
    }
  });

  // Réduit les photos trop lourdes avant l'envoi (max 2400 px, JPEG 88 %),
  // pour rester sous la limite d'envoi tout en gardant une qualité HD.
  var MAX = 2400;
  function reduire(file) {
    return new Promise(function (resolve) {
      if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return resolve(file);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        URL.revokeObjectURL(url);
        var w = img.naturalWidth, h = img.naturalHeight;
        if (Math.max(w, h) <= MAX && file.size < 3.5 * 1024 * 1024) return resolve(file);
        var r = Math.min(1, MAX / Math.max(w, h));
        var c = document.createElement('canvas');
        c.width = Math.round(w * r);
        c.height = Math.round(h * r);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        c.toBlob(function (blob) {
          if (!blob) return resolve(file);
          resolve(new File([blob], file.name.replace(/\.\w+$/, '') + '.jpg', { type: 'image/jpeg' }));
        }, 'image/jpeg', 0.88);
      };
      img.onerror = function () { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  document.addEventListener('change', function (e) {
    var input = e.target;
    if (!(input instanceof HTMLInputElement) || input.type !== 'file' || !input.files || !input.files.length) return;
    var files = Array.prototype.slice.call(input.files);
    var apercu = input.getAttribute('data-apercu') ? document.getElementById(input.getAttribute('data-apercu')) : null;
    Promise.all(files.map(reduire)).then(function (out) {
      if (typeof DataTransfer !== 'undefined') {
        var dt = new DataTransfer();
        out.forEach(function (f) { dt.items.add(f); });
        input.files = dt.files;
      }
      if (apercu && out[0]) {
        apercu.src = URL.createObjectURL(out[0]);
        apercu.hidden = false;
      }
    });
  });
})();
