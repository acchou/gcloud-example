# Google Cloud Compute and Storage example

This is work in progress.

## Enabling VS Code Intellisense in mixed TypeScript / JavaScript projects

In theory VS Code has great support for autocomplete, go-to-definition, and
other great features for both TypeScript and JavaScript. Once you've used it,
it's impossible to go back to programming plain JavaScript without Intellisense.

If you have a pure TypeScript project, Intellisense works well. Similarly, with
a pure JavaScript, JavaScript Intellisense does some impressive
[magic](https://github.com/Microsoft/TypeScript/wiki/JavaScript-Language-Service-in-Visual-Studio),
including type inference, reading JSDoc comments, and automatically "borrowing"
types from TypeScript type declaration files. None of these affect the runtime
behavior of JavaScript, they just augment the information available to VS Code.

But there's a fairly glaring hole. Mixed TypeScript / JavaScript projects have
an inferrior Intellisense experience for JavaScript files compared with pure
JavaScript projects.

Why is this a problem? Because autocomplete works for `require`ing in a pure
JavaScript project, but as soon as you add a tsconfig.json, autocomplete stops
working. That's because once the TypeScript compiler is setup for a project, it
expects that imports have a type declaration file. If they don't, then imports
default to having type `any`, and all type checking and autocomplete are lost
for those imports.

This problem also shows itself when importing a JavaScript package that lacks
type declaration files (ahem... looking at you, [Google
Cloud](https://github.com/GoogleCloudPlatform/google-cloud-node/issues/952).)
While most major packages have type declarations, there is a long tail of useful
libraries that don't. Many of them have at least partial support for
autocomplete in pure JavaScript projects, but none at if they are included in a
TypeScript project.

But there is a simple trick to have it both ways. First, modify tsconfig.json:

    {
        "compilerOptions": {
            "allowJs": true,
            "checkJs": false,
            "allowSyntheticDefaultImports": true
            ...
        },
        "include": ["src", "types"],
        "exclude": ["node_modules", "build"]
    }

We need `allowJs` to enable compilation of JavaScript files. However, `checkJs`
should be turned off because importing JavaScript modules without type
declarations causes many errors due to missing types.

I'll assume that your `.ts` and `.js` files are in single source directory, for
example `src/`.

Finally, create a directory **outside** `src/`. I'll call it `js/`. Use symlinks
to reference all of your `.js` files from within `js/`, like so:

    $ cd js/
    $ ln -s ../src/*.js .

The resulting project tree looks like this:

    .
    ├── js
    │   └── compute.js -> ../src/compute.js
    └── src
        ├── compute.js
        ├── index.ts
        └── storage.ts

The project should build properly. Running `tsc` from the project directory
should compile everything in `src/` including `.js` files. If you open up any
`src/*.js` file, VS Code will happily let you edit the file, but autocomplete
and other Intellisense features will be missing for imports.

But if you open the same files in `js/*.js`, Intellisene works. Yes, even though
they are just symlinks to the same files in `src/`. The fact that they're just
symlinks means the files are never out of sync (you do need to manually add new
symlinks for new `.js` files).

Until the VS Code developers address this issue directly, this seems like a good
compromise that allows you to get started quickly using JavaScript packages that
lack type declaration files while still getting some Intellisense features. Note
that these features aren't perfect... but then most type declaration files
aren't either.
