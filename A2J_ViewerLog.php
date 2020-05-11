<?php
/*
	A2J Author 6 * Justice * justicia * 正义 * công lý * 사법 * правосудие
	All Contents Copyright The Center for Computer-Assisted Legal Instruction

	08/16/2011 Handle silent logging. A2J Viewer will ignore any results returned.
*/

header("Content-type: text/plain");
header("Content-Type: text/html; charset=utf-8");


$data="\n".
	"Flash Version: ".$_POST["FlashVersion"]."\n".
	"OSVersion: ".$_POST["OSVersion"]."\n".
	"PlayerType: ".$_POST["PlayerType"]."\n".
	"LanguageOS: ".$_POST["LanguageOS"]."\n".
	"ErrorMessage: ".stripslashes($_POST["ErrorMessage"])."\n".
	"A2JVersion: ".$_POST["A2JVersion"]."\n".
	"CurrentQuestion: ".$_POST["CurrentQuestion"]."\n".
	"TemplateURL: ".$_POST["TemplateURL"]."\n".
	"GetDataURL: ".$_POST["GetDataURL"]."\n".
	"FileDataURL: ".$_POST["FileDataURL"]."\n".
	"ViewerURL: ".$_POST["ViewerURL"]."\n";
	$logID=date("Y-m-d-H-i-s");


if ($_REQUEST['user']=='1')
{
	$data="Reason: ".stripslashes($_POST["Reason"])."\n".$data;
	file_put_contents ("a2jerrlogs/user_$logID.txt",$data);
}
else
	file_put_contents ("a2jerrlogs/auto_$logID.txt",$data);

echo "Thanks for your submissions!";
?>
