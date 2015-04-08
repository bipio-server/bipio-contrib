To Install Modules from bipio-contrib

`git clone git@github.com:bipio-server/bipio-contrib.git`

`rsync -rav ./bipio-contrib/modules/{module name} {/path/to/bipio}/src/modules`

Add the module constructor to `{/path/to/bipio}/config/{env}.json` under the `modules` section.

Restart the server.
