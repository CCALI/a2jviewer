<?php
  error_reporting(E_ALL);

  // replace spaces and drop zip extension
  $minusDotZip = isset($_FILES['file']['name']) ? pathinfo($_FILES['file']['name'], PATHINFO_FILENAME) : '';
  $replaceSpecialChars = preg_replace('/[^a-zA-Z0-9\s]/', "", $minusDotZip);
  $hyphenatedZipFileName = strtolower(str_replace(" ","-", $replaceSpecialChars));
  // set uniq Id and path for guides
  $guideId = uniqid() . '-' . $hyphenatedZipFileName;
  $guidesPath = '../guides/';
  // grab temp zip file
  $tempZipFilePath = isset($_FILES['file']['tmp_name']) ? $_FILES['file']['tmp_name'] : '';

  function removeDirectoryAndContents($path) {
    // protect against empty path
    if (empty($path)) {
      return false;
    }
    // find all files ignoring . or .. but including other hidden files
    $files = array_diff(scandir($path), array('.', '..'));

    foreach ($files as $file) {
      (is_dir("$path/$file")) ? removeDirectoryandContents("$path/$file") : unlink("$path/$file");
    }

    return rmdir($path);
  }

  // 'routes' based on GET or zip file being present
  $getSent = isset($_GET['delete']) ? $_GET['delete'] : '';

  if ($getSent !== '') {
    // Recommended best practice to protect against code injection
    parse_str($_SERVER['QUERY_STRING'], $urlParams);
    $idToRemove = $urlParams['delete'];

    removeDirectoryAndContents($guidesPath . '/' . $idToRemove);
    header("Location: index.php");
  }

  if ($tempZipFilePath !== '') {
    $zip = new ZipArchive;
    $opened = $zip->open($tempZipFilePath);
    
    $isSafe = false;
    $extractPath = $guidesPath . '/' . $guideId;
    
    if ($opened === TRUE) {
      
      // check for proper file structure and safety
      
      if($zip->getFromName('Guide.json')) {
        // check if contained files are in whitelist
        // don't want to upload executable code
        $allowed =
         ['xml', 'jpg', 'png', 'gif', 'mp4',
          'mp3', 'pdf', 'json', 'zip', 'backup'];

        $i = 0;
        for (; $i < $zip->numFiles; $i++) {
             $filename = $zip->getNameIndex($i);
             $matches =[];

             // find file extension without
             // leading period and at end of string
             preg_match('/\.(\w+)$/', $filename, $matches);
             if (count($matches)){
               if (!in_array($matches[1], $allowed)){
                break;
               }
             }
        }

        // if all files have been looked at without finding
        // something unsafe, then it is safe
        if ($i  === $zip->numFiles){
             $isSafe = true;
        }
      }
    }
    
    // all good. zip is safe. extract
    // This case also should cover
    // if the zip fails to open
    // as $isSafe is never set to true
    if ($isSafe){
      // if zip was opened, $zip object will be valid
      $foldername = $zip->getNameIndex(0);
      $canExtract = $zip->extractTo($extractPath);
      if (!$canExtract){
        // Not sure if this error and
        // the next in the else should be different
        // But they are distinct cases.
        // Not sure if it matters but log data
        // could be interesting
        echo 'Attempt to upload unextractable guide <br/><br/>';
        error_log('Attempt to upload unextractable guide');
      }
      $zip->close();
    } else {
      echo 'Attempt to upload bad guide <br/><br/>';
      error_log('Attempt to upload bad guide');
    }
  }
?>

<!-- Create a clickable list of all guides, launching the guide/viewer -->

<h3>Current Guide List</h3>
<ul>
  <?php foreach (glob('../guides/*', GLOB_ONLYDIR) as $directoryName) : ?>
    <?php $viewerUrl = 'viewer.html?templateURL='. $directoryName .'/Guide.xml&fileDataURL='. $directoryName .'/'; ?>
    <li>
      <a href="?delete=<?php echo $directoryName; ?>">[Delete]</a>
      <a target="_blank" href="<?php echo $viewerUrl; ?>">
        <?php echo basename($directoryName); ?>
     </a>
    </li>
  <?php endforeach; ?>
</ul>

<!-- Form for uploading/posting guides -->
<h3>Upload New Guide</h3>
<p>Choose a .zip file exported from the A2J Author:</p>
<form action="index.php" method="post" target="_self" enctype="multipart/form-data">
  <input type="file" name="file" accept=".zip">
  <input type="submit" value="Upload">
</form>
