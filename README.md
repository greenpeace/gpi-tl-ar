# tl-ar
Techlab team have been exploring using Augmented Reality as a widely deployable engagement tool. Thanks to the phones many of us carry and cross-platform web technologies ([ThreeJS](https://github.com/mrdoob/three.js/) and [AR.js](https://github.com/jeromeetienne/AR.js/blob/master/README.md)) it's possible to use a web browser to explore a 3D scene projected into your environment using your smart phones built-in browser.

This month we have created a demo showing how a user can use their mobile device and a custom Greenpeace AR logo to explore the impact of their lifestyle on the environment by creating a mythical landscape that scales with their individual impact.

[Test Site](https://greenpeace.international/ar-test/)

### uploadserver
```
tl-ar
└── uploadserver
      ├── index.js
      ├── package.json
      └── public [empty]
```
The code for the upload server can also be used as a standalone upload server. Necessary are just `index.js`, `package.json` and an empty `public` folder. Don't forget to change the paths according to your *letsencrypt* files location. 

