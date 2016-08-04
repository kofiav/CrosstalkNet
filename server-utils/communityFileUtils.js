'use strict'
/**
 * This file contains functions that help read, write, and delete files
 * and directories. There are also functions that maintain an in memory cache
 * of available matrix files for a given user based on their access level. 
 * 
 * @summary Methods for: reading, writing, deleting, and keeping track of Rdata files.
 */
const fs = require('fs');
var async = require('async');
var mkdirp = require('mkdirp');
var CommunityFileCache = require('./Models/communityFileCache').CommunityFileCache;
var File = require('./Models/fileModel').File;
var availableCommunitiesCache = null;

var BASE_UPLOAD_DIRECTORY = 'R_Scripts/Communities/';

/**
 * @summary Updates the in-memory cache of avaialble files.
 */
function updateAvailableCommunityCache() {
    availableCommunitiesCache = updateAvailableCommunityCache();
}

/**
 * @summary Returns an object that represents all of the existing matrix files.
 *
 * @return An object whose keys are: real, fake, personal. This helps group files based on whether they are our 
 * proprietary data, fake data, or user uploaded data. The values are objects 
 */
function createAvailableCommunityCache() {
    var result = new CommunityFileCache();

}

/**
 * @summary Matches the front end file in the
 * selected files that is not null and returns the
 * corresponding File from the available matrix cache.
 *
 * @param {Object} selectedFiles An object whose keys are TYPES and whose
 * values are a front-end specified file.
 * @param {User} user The User for which to obtain the File.
 * @return {File} A File from the availableMatrixCache that matches the front-end file
 * specified in selectedFiles. 
 */
function getRequestedFile(selectedFile) {
    var file;

    if (selectedFile != null) {
        file = matchSelectedFile(selectedFile, availableCommunitiesCache, user);
    }

    return file;
}

function getCorrespondingDegreesFileName(file) {
    return DEGREES_FILE_PREFIX + file.name;
}

/**
 * @summary Matches the front ends files in selected files and returns
 * the corresponding Files from the availableMatrixCache.
 *
 * @param {Oject} selectedFiles An object whose keys are TYPES and whose
 * values are a front-end specified files.
 * @param {string} selectedNetworkType A string that should be one of the values
 * in TYPES. This specifies what type of network the request, and the function 
 * uses this in order to determine the right number of files to return.
 * @param {User} user The User for which to obtain the Files. 
 * @return {Object} An object containing the Files specified.
 */
function getRequestedFiles(selectedFiles, selectedNetworkType, user) {
    var result = { normal: null, tumor: null, delta: null, degree: null };
    var file = null;

    if (selectedFiles == null) {
        return null;
    }

    if (selectedNetworkType == SUB_TYPES.normal && selectedFiles.normal != null) {
        file = matchSelectedFile(selectedFiles.normal, availableMatrixCache, user);

        if (file != null) {
            result.normal = file.path + file.name;
            result.degree = file.path + "degrees" + file.name;
        }
    } else if (selectedNetworkType == SUB_TYPES.tumor && selectedFiles.tumor != null) {
        file = matchSelectedFile(selectedFiles.tumor, availableMatrixCache, user);

        if (file != null) {
            result.tumor = file.path + file.name;
            result.degree = file.path + "degrees" + file.name;
        }
    } else if (selectedNetworkType == SUB_TYPES.delta && selectedFiles.delta != null) {
        file = matchSelectedFile(selectedFiles.delta, availableMatrixCache, user);

        if (file != null) {
            result.delta = file.path + file.name;
            result.degree = file.path + "degrees" + file.name;
        }

        file = matchSelectedFile(selectedFiles.normal, availableMatrixCache, user);
        if (file != null) {
            result.normal = file.path + file.name;
        }
        file = matchSelectedFile(selectedFiles.tumor, availableMatrixCache, user);
        if (file != null) {
            result.tumor = file.path + file.name;
        }

        if (result.tumor == null || result.normal == null) {
            return null;
        }
    } else {
        return null;
    }

    return result;
}

/**
 * @summary Reads the contents of a given directory
 * and created an array of Files based on the file names
 * found in the directory.
 *
 * @param {string} directory A path relative to server.js
 * @param {string} type One of the values in TYPES. This will
 * be added to every created File object.
 * @param {string} subType One of the values in SUB_TYPES. This will
 * be added to every created File object.
 * @return {Array} An array of Files representing the files found in the specified
 * directory. 
 */
function getFilesInDirectory(directory, type, subType) {
    var filteredFileNames = null;
    var originalFilesNames = null;
    var fileList = null;

    originalFilesNames = fs.readdirSync(directory);

    filteredFileNames = originalFilesNames.filter(function(fileName) {
        if (fileName.indexOf('degree') < 0 && originalFilesNames.indexOf('degrees' + fileName) >= 0 && fileName.indexOf('gitkeep') < 0) {
            return true;
        } else {
            return false;
        }
    });

    fileList = filteredFileNames.map(function(file) {
        return new File(file, directory + "/", type, subType);
    });

    return fileList;
}

/**
 * @summary Returns a File from the availableMatrixCache based
 * on the fiven front-end file.
 *
 * @param {Object} file The front-end file specified.
 * @param {FileCache} cache A FileCache to match the specified file in.
 * @param {User} user The User for which to obtain the File.
 * @return {File} A File based on the front-end file specified for 
 * the given User.
 */
function matchSelectedFile(file, cache, user) {
    return cache.matchFile(file, user);
}

/**
 * @summary Removes a and its corresponding degrees file from the disk.
 *
 * @param {string} path The relative path to the file from server.js, not 
 * including the file name.
 * @param {string} file The name of the file to delete.
 * @param {function} callback A function to call when the files have been deleted.
 */
function removeFile(path, file, callback) {
    var error = false;
    if (path != null && file != null) {

        async.series([
                function(cbInner) {

                    fs.unlink(path + file.name, function(err) {
                        if (err) {
                            console.log(err);
                            cbInner(null, "Failed1");
                        } else {
                            cbInner();
                        }
                    });
                },
                function(cbInner) {
                    fs.unlink(path + 'degrees' + file.name, function(err) {
                        if (err) {
                            console.log(err);
                            cbInner(null, "Failed2");
                        } else {
                            cbInner();
                        }
                    });
                }
            ],
            function(err, results) {
                // console.log("results in fileUtils.js: %j", results);
                // console.log("err: %j", err);

                if (results != null && results.length > 0 && (results[0] != null || results[1] != null) || err != null) {
                    if (callback) {
                        callback(null, "Failed");
                    }
                } else {
                    if (callback) {
                        callback();
                    }
                }
            });
    }
}

/**
 * @summary Writes a file to the disk in the directory
 * based on the concatentation of baseDirectory and userName.
 *
 * @param {string} baseDirectory A file path relative to server.js. This
 * will be combined with userName to form the directory where the file will
 * be saved.
 * @param {Object} file An object containing the name of a file and its associated data
 * encoded in Base64.
 * @param {string} userName The user name of the user that uploaded the file.
 * @param {string} subType The sub type of the file. This can take on one of the
 * values in SUB_TYPES.
 * @param {function} callback A function to call when the file is finished writing.
 */
function writeFile(baseDirectory, file, callback) {
    fs.writeFile(baseDirectory + userName + "/" + subType + "/" + file.name, file.data, 'base64', (err) => {
        if (err) {
            console.log(err);
            callback("Failed");
        } else {
            console.log("Wrote: " + file.name);
            callback();
        }
    });
}

/**
 * @summary Creates a directory, if it doesn't exist, with the path being baseDirectory,
 * userName, and subType concatenated in that order.
 *
 * @param {string} baseDirectory A file path relative to server.js. This will be combined 
 * with userName and subType to obtain the full path of the directory to be created.
 * @param {string} userName The name of the user for which to create the directory.
 * @param {string} subType The sub type of the directory.
 */
function createDirectory(baseDirectory, userName, subType, callback) {
    mkdirp.sync(baseDirectory + userName + "/" + subType, function(err) {
        if (err) {
            if (callback) {
                callback("Failed");
            }

            console.error(err)
        }
    });
}

module.exports = {
    BASE_UPLOAD_DIRECTORY: BASE_UPLOAD_DIRECTORY,
    BASE_PROPRIETARY_DIRECTORY: BASE_PROPRIETARY_DIRECTORY,
    BASE_FAKE_DIRECTORY: BASE_FAKE_DIRECTORY,
    getRequestedFile: getRequestedFile,
    getRequestedFiles: getRequestedFiles,
    getFilesInDirectory: getFilesInDirectory,
    removeFile: removeFile,
    writeFile: writeFile,
    createDirectory: createDirectory,
    updateAvailableMatrixCache: updateAvailableMatrixCache,
    getAccessibleMatricesForUser: getAccessibleMatricesForUser,
    createavailableMatrixCache: createavailableMatrixCache,
    getCorrespondingDegreesFileName: getCorrespondingDegreesFileName
};
