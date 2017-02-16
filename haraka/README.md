
Haraka
=========

This is the BipIO SMTP config for [Haraka](https://github.com/baudehlo/Haraka). It consists of two plugins for unpacking
SMTP bip's and firing them into the servers delivery graph.

## Installation


  Copy the files in `bipio-contrib/haraka/plugins` to your Haraka `config/plugins` directory,
then add the following plugins lookup to the Haraka `plugins/config` file :

```
rcpt_to.bip
queue/bip_forward
```

  The plugins will look for the existence of the `BIPIO_SERVER_ROOT` environment
variable to find the Bipio server bootstrap, as well as `NODE_ENV` so set these to your installation path and application environment respectively.

A sample upstart script `upstart_haraka.conf` has been included for reference, it shows how this environment variable should be set.

How ever else Haraka is configured is up to you, it's [extensively documented](http://haraka.github.io).

It might be easier to isolate Haraka for Bipio by telling Haraka to install its default configs and plugins to a certain directory before you start :

```
haraka -i /custom/plugin/path
```

Then copy plugins and configs into this directory as described above.  To then start Haraka :

```
haraka -c /custom/plugin/path
```

All going well, you should see :

```
Starting up Haraka version 2.2.6
[INFO] [-] [core] Loading plugins
[INFO] [-] [core] Loading plugin: dnsbl
[INFO] [-] [core] loaded TLD files: 1=310 2=3854 3=161
[DEBUG] [-] [core] registered hook connect to dnsbl.hook_connect
[INFO] [-] [core] Loading plugin: data.rfc5322_header_checks
[DEBUG] [-] [core] registered hook data_post to data.rfc5322_header_checks.hook_data_post
[INFO] [-] [core] Loading plugin: helo.checks
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_no_dot
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_no_dot
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_match_re
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_match_re
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_raw_ip
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_raw_ip
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_is_dynamic
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_is_dynamic
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_big_company
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_big_company
[DEBUG] [-] [core] registered hook helo to helo.checks.helo_literal_mismatch
[DEBUG] [-] [core] registered hook ehlo to helo.checks.helo_literal_mismatch
[INFO] [-] [core] Loading plugin: mail_from.access
[DEBUG] [-] [core] registered hook mail to mail_from.access.mail_from_access
[INFO] [-] [core] Loading plugin: mail_from.is_resolvable
[DEBUG] [-] [core] plugin mail_from.is_resolvable set timeout to: 0s
[DEBUG] [-] [core] registered hook mail to mail_from.is_resolvable.hook_mail
[INFO] [-] [core] Loading plugin: max_unrecognized_commands
[DEBUG] [-] [core] registered hook connect to max_unrecognized_commands.hook_connect
[DEBUG] [-] [core] registered hook unrecognized_command to max_unrecognized_commands.hook_unrecognized_command
[INFO] [-] [core] Loading plugin: rcpt_to.access
[DEBUG] [-] [core] registered hook rcpt to rcpt_to.access.rcpt_to_access
[INFO] [-] [core] Loading plugin: rcpt_to.in_host_list
[DEBUG] [-] [core] registered hook rcpt to rcpt_to.in_host_list.hook_rcpt
[INFO] [-] [core] Loading plugin: rcpt_to.bip
[DEBUG] [-] [core] registered hook rcpt to rcpt_to.bip.rcpt_to_bip
[DEBUG] [-] [core] registered hook data to rcpt_to.bip.hook_data
[DEBUG] [-] [core] registered hook data_post to rcpt_to.bip.hook_data_post
[INFO] [-] [core] Loading plugin: queue/bip_forward
[DEBUG] [-] [core] registered hook queue to queue/bip_forward.hook_queue
[NOTICE] [-] [core] Listening on :::25
[DEBUG] [-] [core] [server] running init_master hooks
[INFO] [-] [core] [outbound] Loading outbound queue from /var/local/www/cloudspark/prod/haraka/config/queue
info: 20593:1383406351830:DAO:MONGODB:Connected
info: 20593:1383406352809:RABBIT:Connected
info: 20593:1383406352857:RABBIT:X:bastion_generic:UP
info: 20593:1383406352858:RABBIT:X:bastion_jobs:UP
info: 20593:1383406352858:RABBIT:X:bastion_ctl:UP
info: 20593:1383406352860:RABBIT:Q:PUBSUBqueue_bastion:UP
info: 20593:1383406352861:RABBIT:Q:PUBSUBqueue_jobs:UP
info: 20593:1383406352862:RABBIT:Q:PUBSUBqueue_bastion_ctl:UP
```




## Testing SMTP

Use [Swaks](http://www.jetmore.org/john/code/swaks/index.html) its pretty great.

## License

Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.

Copyright (c) 2017 InterDigital, Inc. All Rights Reserved
