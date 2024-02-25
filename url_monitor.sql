CREATE TABLE `url_monitor` (
  `ref` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `server_group` varchar(20) DEFAULT NULL,
  `name` varchar(50) NOT NULL,
  `url` varchar(200) NOT NULL,
  `line_token` varchar(128) NOT NULL,
  `isactive` tinyint(1) unsigned NOT NULL DEFAULT '1',
  `created` datetime DEFAULT CURRENT_TIMESTAMP,
  `lastupdate` timestamp NULL DEFAULT NULL ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`ref`),
  UNIQUE KEY `url` (`url`,`line_token`),
  UNIQUE KEY `server_group` (`server_group`,`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;