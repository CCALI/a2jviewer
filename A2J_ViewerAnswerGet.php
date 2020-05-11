<?php
/*
	A2J Author 6 * Justice * justicia * 正义 * công lý * 사법 * правосудие
	All Contents Copyright The Center for Computer-Assisted Legal Instruction

	04/15/2013

	Called by the A2J Viewer to retrieve a user's answer file.
	Always called at the start of an interview.
	If there's no data, return a blank document.
*/

	$answersID=$_GET["answersID"];
	if (isset($answersID) && $answersID!=''){
		$getData="$answersID";
	}
	else{
		$getData="blank_answerset.xml";
	}


	header("Content-type: text/plain");	//header("mime-type","plaintext/xml");
	//echo file_get_contents("../tests/data/sample_answers-1.anx");
	echo file_get_contents($getData);

?>
