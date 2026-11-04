// Google Apps Script: paste into script.google.com, then Deploy > Manage deployments > Edit > New version.
// Execute as: Me | Who has access: Anyone
function doPost(e) {
  try {
    var d = JSON.parse(e.postData.contents);
    var blob = Utilities.newBlob(
      Utilities.base64Decode(d.file || d.base64),
      d.mimeType || d.type || 'application/octet-stream',
      d.name || d.filename || 'upload'
    );
    var f = DriveApp.createFile(blob);
    f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    var id = f.getId();
    return ContentService.createTextOutput(JSON.stringify({
      ok: true, fileId: id, url: 'https://drive.google.com/uc?export=view&id=' + id
    })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok: false, error: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
