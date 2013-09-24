Haraka

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
variable to find the Bipio server bootstrap, so set this to your installation path.

How ever else Haraka is configured is up to you, it's [Extensively Documented](http://haraka.github.io).

A sample upstart script `upstart_haraka.conf` has been included for reference.

## Testing SMTP

[Swaks](http://www.jetmore.org/john/code/swaks/index.html)

## License

BipIO is free for non-commercial use.

[GPLv3](http://www.gnu.org/copyleft/gpl.html)

Our open source license is the appropriate option if you are creating an open source application under a license compatible with the GNU GPL license v3. 

Bipio may not be used for Commercial purposes by an entity who has not secured a Bipio Commercial OEM License.  To secure a Commercial OEM License for Bipio,
please [reach us](mailto:enquiries@cloudspark.com.au)

![Cloud Spark](http://www.cloudspark.com.au/cdn/static/img/cs_logo.png "Cloud Spark - Rapid Web Stacks Built Beautifully")
Copyright (c) 2010-2014  [CloudSpark pty ltd](http://www.cloudspark.com.au)
