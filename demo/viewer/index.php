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
    if ($opened === TRUE) {
      $extractPath = $guidesPath . '/' . $guideId;
      // check for proper file structure
      if($zip->getFromName('Guide.json')) {
        $zip->extractTo($extractPath);
      } else {
        echo '<h4>Badly formatted .zip file, please choose another.</h4>';
      }
      $zip->close();
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
