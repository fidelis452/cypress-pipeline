pipeline {
    agent {
            node {
                label 'alpha'
            }
        }
    
    options {
        buildDiscarder logRotator(artifactDaysToKeepStr: '', artifactNumToKeepStr: '5', daysToKeepStr: '', numToKeepStr: '5')
    }
    
    environment {
        uiPod = ''
        cypressPod = ''
        logs = ''
        deploy = false
    }

    stages {
         

        stage('Kill pods if running') {
            steps {
                script {

                    sh "pwd"
                    // sh "rm -r /shared/app/"
                    
                    // Initialize variables to track pod and pipeline status
                    def firstRunCompleted = false
                    def breakLoop = false
                    def podsFound = false

                    // Loop until pods are not found or for a specific number of iterations
                    def maxIterations = 5 
                    def currentIteration = 0
                    

                    while (currentIteration < maxIterations && breakLoop==false) {
                        echo "Checking pod existence and statuses..."
                        def podStatuses = checkExistence()
                        def expressAppExists = podStatuses['expressAppExists']
                        def uiAppExists = podStatuses['uiAppExists']
                        def expressAppServiceExists = podStatuses['expressAppServiceExists']
                        def uiAppServiceExists = podStatuses['uiAppServiceExists']
                        def e2eTestJobExists = podStatuses['e2eTestJobExists']
                        def podStatusesJson = podStatuses['podStatuses']






                        // Check if any pods are found
                        if (expressAppExists || uiAppExists || expressAppServiceExists || uiAppServiceExists || e2eTestJobExists || podStatusesJson.contains("Terminating")) {

                            // Delete pods only if it's the first time they are found
                            if (!firstRunCompleted) {
                                echo "Deleting pods..."
                                if (expressAppExists) {
                                    sh "kubectl delete -n filetracker deployment express-api"
                                    
                                }
                                if (uiAppExists) {
                                    sh "kubectl delete -n filetracker deployment ui-vue-app"
                                }
                                if (expressAppServiceExists) {
                                    sh "kubectl delete -n filetracker service express-api-service"
                                }
                                if (uiAppServiceExists) {
                                    sh "kubectl delete -n filetracker service ui-vue-app-service"
                                }
                                if (e2eTestJobExists) {
                                    sh "kubectl delete -n filetracker job cypress-job"
                                }

                                firstRunCompleted = true
                                podsFound = true
                            } else {
                                echo "Not all pods have finished terminating. Waiting 15 secs for pods to terminate..."
                                sleep 15 // Wait for 15 seconds before checking again
                            }
                        } else {
                            echo "No running or terminating pods. Proceeding to create testing pods..."
                            breakLoop = true
                        }

                        currentIteration++
                    }

                    if (!podsFound) {
                        echo "No pods found or terminated."
                    }
                    
                }
            }
        }

        stage('Start API Pods') {
            steps {
                script {

                        sh 'kubectl apply -f express-api/kubernetes'

                }
            }
        }

        
        stage('Run UI') {
            steps {
                script {
                    def retries = 24
                    def delaySeconds = 15
                    def attempts = 0

                    // sh "kubectl get all -n filetracker"


                    retry(retries) {

                        attempts++

                        echo "Running UI stage...Attempt ${attempts}"

                        // Execute curl command to check if api endpoint returns successful response
                        def statusOutput = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://express-api-service.filetracker/students', returnStdout: true).trim()
                            
                        // Convert output to integer
                        def statusCode = statusOutput.toInteger()

                        if (statusCode == 200) {
                            sh "kubectl apply -f ui-app/kubernetes"
                            echo "found api and started ui"
                        } else {
                            echo "API not yet up. Returned status code - ${statusCode} when probed"
                            echo "Retrying in ${delaySeconds} seconds..."
                            sleep delaySeconds
                            echo "API not up. Retry ${attempt}"
                        }                      
                        
                    }
                    sh 'kubectl get pods -n filetracker'
                    sh 'kubectl get svc -n filetracker'
                }
            }
        }

        stage('Run cypress test') {
            steps {
                script {

                    sh 'kubectl get pods -n filetracker'
                    sh 'kubectl get svc -n filetracker'

                    // def retries = 24
                    // def delaySeconds = 15
                    // def attempts = 0


                    // retry(retries) {

                    //     attempts++

                    //     echo "Waiting for UI to run...Attempt ${attempts}"

                        
                            // Execute curl command to check if api endpoint returns successful response
                            // def statusOutput = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://ui-vue-app-service.filetracker/', returnStdout: true).trim()
                                
                            // // Convert output to integer
                            // def statusCode = statusOutput.toInteger()


                            // if (statusCode == 200) {
                            //     echo "Found UI. Starting Cypress Job"
                            //     // remove old report

                                // sh 'rm -f /shared/cypress/reports/html/index.html'
                                // sh 'rm -f /shared/cypress/reports/mochawesome.html'
                                // sh 'rm -f /shared/cypress/reports/mochawesome.json'

                                sh 'kubectl apply -f cypress-tests/kubernetes'

                                
                            // } else {
                            //     echo "UI not yet up. Returned status code - ${statusCode} when probed"
                            //     echo "Retrying in ${delaySeconds} seconds..."
                            //     sleep delaySeconds
                            //     echo "UI not up. Retry ${attempts}"
                            // }
                        
                    // }

                    sh '''
                    pwd
                    ls -la
                    '''
                }
            }
        }


        stage('Get Pod Names') {
            steps {
                script {
                        
                        uiPod = sh(script: 'kubectl get pods -n filetracker -l app=ui-vue-app -o jsonpath="{.items[0].metadata.name}"', returnStdout: true).trim()
                        echo "Found pod name: $uiPod"
                        cypressPod = sh(script: "kubectl get pods -n filetracker -l job-name=cypress-job -o jsonpath='{.items[0].metadata.name}'", returnStdout: true).trim()
                        echo "Found Cypress pod name: $cypressPod"
                    
                }
            }
        }

            

        stage('Wait for tests to run and report generation') {
            steps {
                script {

                    waitForReport(uiPod)

                    sh "kubectl exec -n filetracker $uiPod -- cat /shared/cypress/reports/html/index.html > report_build_${env.BUILD_NUMBER}.html"
                    archiveArtifacts artifacts: "report_build_${env.BUILD_NUMBER}.html", onlyIfSuccessful: true

                }
            }
        }

        // stage('Capture Cypress Logs and decide deployment') {
        //     steps {
        //         script {
        //             sh """
        //                 node <<EOF
        //                 const fs = require("fs");
        //                 const { parseString } = require("xml2js");

        //                 // Directory containing XML files
        //                 const directory = "./reports/junit/";

        //                 // Initialize total failures count
        //                 let totalFailures = 0;

        //                 // Function to read and process XML file
        //                 const processXMLFile = (file) => {
        //                     return new Promise((resolve, reject) => {
        //                         // Read the XML file
        //                         fs.readFile(directory + file, "utf8", (err, data) => {
        //                             if (err) {
        //                                 console.error('Error reading XML file ${file}:', err);
        //                                 reject(err);
        //                                 return;
        //                             }

        //                             // Parse XML string to JSON
        //                             parseString(data, (parseErr, result) => {
        //                                 if (parseErr) {
        //                                     console.error('Error parsing XML ${file}:', parseErr);
        //                                     reject(parseErr);
        //                                     return;
        //                                 }

        //                                 // Access the testsuites object from the parsed JSON
        //                                 const testsuites = result.testsuites;

        //                                 // Get the number of failures for each testsuite
        //                                 const failures = parseInt(testsuites.$.failures);

        //                                 // Add failures count to totalFailures
        //                                 totalFailures += failures;

        //                                 resolve();
        //                             });
        //                         });
        //                     });
        //                 };

        //                 // Read the directory
        //                 fs.readdir(directory, (err, files) => {
        //                     if (err) {
        //                         console.error("Error reading directory:", err);
        //                         return;
        //                     }

        //                     // Array to store promises for each file processing
        //                     const promises = [];

        //                     // Iterate through each file
        //                     files.forEach((file) => {
        //                         // Check if file is XML
        //                         if (file.endsWith(".xml")) {
        //                             // Process XML file and push the promise to the array
        //                             promises.push(processXMLFile(file));
        //                         }
        //                     });

        //                     // Execute all promises
        //                     Promise.all(promises)
        //                         .then(() => {
        //                             // Output the total failures across all files after processing all XML files
        //                             console.log('Total failures across all files:', totalFailures);
        //                         })
        //                         .catch((error) => {
        //                             console.error("Error processing XML files:", error);
        //                         });
        //                 });
        //                 EOF
        //             """
        //         }
        //     }
        // }



        
        


        stage('Deploy') {
            steps {
                script {
                    
                    if(deploy==true){
                        echo "Niiice!!! Deploying ATQ now."
                    } 
                }
            }
        }

        

    }
}

// def waitForReport(podName) {
//     timeout(time: 5, unit: 'MINUTES') {
//         script {
//             def counter = 0 
//             while (!fileExists(podName,'filetracker','/shared/cypress/reports/html/index.html')) {
//                 sh "kubectl get all -n filetracker"
//                 counter++ 
//                 echo "Waiting for index.html file to exist... (Attempt ${counter})"
//                 sleep 10 
//             }
//         }
//     }
// }


def fileExists(podName, namespace, filePath) {
    def command = "kubectl exec -it -n ${namespace} ${podName} -- ls ${filePath}"
    return sh(script: command, returnStatus: true) == 0
}



def checkExistence() {
        // Check if express-api deployment exists
        def expressAppExists = sh(
            script: "kubectl get -n filetracker deployment express-api >/dev/null 2>&1",
            returnStatus: true
        ) == 0


        // Check if ui-vue-app deployment exists
        def uiAppExists = sh(
            script: "kubectl get -n filetracker deployment ui-vue-app >/dev/null 2>&1",
            returnStatus: true
        ) == 0

        // Check if express-api-service service exists
        def expressAppServiceExists = sh(
            script: "kubectl get -n filetracker service express-api-service >/dev/null 2>&1",
            returnStatus: true
        ) == 0

        // Check if ui-vue-app-service exists
        def uiAppServiceExists = sh(
            script: "kubectl get -n filetracker service ui-vue-app-service >/dev/null 2>&1",
            returnStatus: true
        ) == 0

        // Check if cypress-job job exists
        def e2eTestJobExists = sh(
            script: "kubectl get -n filetracker job cypress-job >/dev/null 2>&1",
            returnStatus: true
        ) == 0

        // Get pod statuses
         def podStatuses = sh(
                        script: 'kubectl -n filetracker get all',
                        returnStdout: true
                    ).trim()
    
    

    return [expressAppExists: expressAppExists, uiAppExists: uiAppExists, 
            expressAppServiceExists: expressAppServiceExists, uiAppServiceExists: uiAppServiceExists, 
            e2eTestJobExists: e2eTestJobExists, podStatuses: podStatuses]
}