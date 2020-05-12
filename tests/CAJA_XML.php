<?php


$filename="data/A2J_FieldTypesTest_Interview.xml";
//		file_put_contents($filename,$xml);
$xml=simplexml_load_file($filename,null, LIBXML_NOCDATA);
//trace($xml);
$details = $xml->DESCRIPTION;
$details = $xml->DESCRIPTION;
echo $details;

//var_dump( $xml );

?>