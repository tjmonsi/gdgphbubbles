/**
 * @license
 * Copyright (c) 2016 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at http://polymer.github.io/PATENTS.txt
 */

/* eslint-env node */

module.exports = {
  staticFileGlobs: [
    '/index.html',
    '/manifest.json',
    '/bower_components/webcomponentsjs/*',
    '/bower_components/chance/*',
    '/bower_components/web-animations-js/*'
  ],
  navigateFallback: 'index.html',
  navigateFallbackWhitelist: [/^(?!(\/__)|(\/service-worker\.js))/],
  runtimeCaching: [
    {
      // cache Google user profile pics
      urlPattern: /^https:\/\/lh3.googleusercontent.com\/.*/,
      handler: 'networkFirst'
    },
    {
      urlPattern: /service-worker.js/,
      handler: 'networkOnly'
    },
    {
      urlPattern: /^https:\/\/maps.googleapis.com\/.*/,
      handler: 'networkFirst'
    },
    {
      urlPattern: /^https:\/\/cdn.ravenjs.com\/.*/,
      handler: 'networkFirst'
    }
  ]
};
