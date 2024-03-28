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
        jenkinsPod = ''
        cypressPod = ''
        logs = ''
        deploy = false
        statusCode = 0
    }


    stages {
        // stage('Git Checkout') {
        //     steps {
        //         script {
        //             git branch: 'main',
        //                 credentialsId: '',
        //                 url: 'https://github.com/fidelis452/cypress-pipeline.git'
        //         }
        //     }
        // }

        // stage('Set up Kubectl') {
        //     steps {
        //         script {
        //             withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {    

        //                 sh 'curl -LO "https://storage.googleapis.com/kubernetes-release/release/v1.20.5/bin/linux/amd64/kubectl"'
        //                 sh 'chmod u+x kubectl'
        //                 sh 'rm -f /var/jenkins_home/html/index.html' 

        //             }
        //         }
        //     }
        // }

        stage('Kill pods') {
            steps {
                script {
                    // withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {

                        // Check if the pod exists before attempting to delete it
                        def expressPodExists = sh(script: "kubectl get pods -n filetracker | grep express-app", returnStatus: true)
                        def uiPodExists = sh(script: "kubectl get pods -n filetracker | grep ui-app", returnStatus: true)

                        // services
                        def expressServiceExists = sh(script: "kubectl get services -n filetracker | grep express-app-service", returnStatus: true)
                        def uiServiceExists = sh(script: "kubectl get services -n filetracker | grep ui-app", returnStatus: true)

                        // jobs
                        def cypressJobExists = sh(script: "kubectl get jobs -n filetracker | grep e2e-test-app-job", returnStatus: true)
                        
                        // Delete the pod if it exists
                        if (expressPodExists == 0) {
                            sh "kubectl delete -n filetracker deployment express-app"
                        }
                        
                        if (uiPodExists == 0) {
                            sh "kubectl delete -n filetracker deployment ui-app"
                        }
                        
                        // Delete the pod if it exists
                        if (expressServiceExists == 0) {
                            sh "kubectl delete -n filetracker service express-app-service"
                        }
                        
                        if (uiServiceExists == 0) {
                            sh "kubectl delete -n filetracker service ui-app"
                        }

                         if (cypressJobExists == 0) {
                            sh "kubectl delete -n filetracker job e2e-test-app-job"
                        }

                        sleep 50
                }
            }
        }

        // stage('Run Express Api') {
        //     steps {
        //         script {  

                    
        //                 sh '''
                        
        //                 pwd
        //             ls -la
        //              kubectl apply -f express-api/kubernetes/deployment.yaml -n filetracker
        //              kubectl get pods,services -n filetracker

        //              cd ~
        //              pwd
        //              ls -la
                     
        //                 '''

        //             sleep 50

        //              sh 'kubectl get pods -n filetracker'

        //             sleep 30

        //              sh 'kubectl get pods -n filetracker'
        //                 // sh 'curl http://express-app-service/students'

        //                 // Execute curl command and capture output
        //                 def statusOutput = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://express-app-service/students', returnStdout: true).trim()

                        
        //                 // Convert output to integer
        //                 statusCode = statusOutput.toInteger()
                        
        //                 // Check status code
        //                 if (statusCode == 200) {
        //                     echo "Status is 200 - OK"
        //                 } else {
        //                     echo "Status is not 200 - ${statusCode}"
        //                 }
        //         }
        //     }
        // }

        stage('Run Express Api') {
            steps {
                script {
                    // Apply deployment YAML
                    sh 'kubectl apply -f express-api/kubernetes/deployment.yaml -n filetracker'
                    
                    // Wait for pods to be ready
                    sleep 30
                    
                    // Check the status of pods
                    sh 'kubectl get pods -n filetracker'
                    
                    // Execute curl command and capture output
                    def statusOutput = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://express-app-service/students', returnStdout: true, returnStatus: true)
                    
                    // Check if curl command was successful
                    if (statusOutput == 0) {
                        // Capture HTTP status code
                        statusCode = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://express-app-service/students', returnStdout: true).trim().toInteger()
                        
                        // Check status code
                        if (statusCode == 200) {
                            echo "Status is 200 - OK"
                        } else {
                            echo "Status is not 200 - ${statusCode}"
                        }
                    } else {
                        echo "Failed to execute curl command"
                    }
                }
            }
        }


        stage('Run Ui App') {
            steps {
                script {                     
                        // Check status code
                        if (statusCode == 200) {
                            sh '''
                              kubectl apply -f  ui-app/kubernetes -n filetracker

                                sleep 50

                              kubectl get pods -n filetracker
                            '''
                            
                        } else {
                            echo "Status is not 200 - ${statusCode}"
                        }
                }
            }
        }


        stage('Run cypress') {
            steps {
                script {    
                            sh '''
                              kubectl apply -f cypress-tests/kubernetes -n filetracker

                              kubectl get pods
                            '''
                }
            }
        }

        stage('Get Pod Names') {
            steps {
                script {               
                    sh '''
                    kubectl get pods -n filetracker
                    '''       
                        // jenkinsPod = sh(script: 'kubectl get pods -n filetracker -l app=jenkins -o jsonpath="{.items[0].metadata.name}"', returnStdout: true).trim()
                        // echo "Found pod name: $jenkinsPod"
                        cypressPod = sh(script: "kubectl get pods -n filetracker -l job-name=e2e-test-app-job -o jsonpath='{.items[0].metadata.name}'", returnStdout: true).trim()
                        echo "Found Cypress pod name: $cypressPod"
                }
            }
        }

        // stage('Wait for tests to run and report generation') {
        //     steps {
        //         script {
        //             waitForReport()
        //             sh "kubectl exec -n filetracker $jenkinsPod -- cat /var/jenkins_home/html/index.html > report.html"
        //             archiveArtifacts artifacts: 'report.html', onlyIfSuccessful: true
        //             }
        //         }
        //     }
        // }
        

        stage('Deciding deployment and stopping testing pods') {
            steps {
                script {

                        // Run kubectl logs command and store the output
                        logs = sh(script: "kubectl logs -n filetracker $cypressPod -c e2e-test-app", returnStdout: true).trim()

                        // Check if the text "all specs passed" is present in the logs
                        if (logs.contains("All specs passed")) {
                            echo "Specs passed: true \n Proceeding to deployment"
                            deploy = true
                        } else {
                            echo "some tests failed...Check the report for issues \n Deployment aborted"
                        }

                        //kill the created pods and service.

                        // sh "kubectl delete -n filetracker deployment express-app"
                        // sh "kubectl delete -n filetracker deployment ui-app"
                        // sh "kubectl delete -n filetracker job e2e-test-app-job"
                        // sh "kubectl delete -n filetracker service ui-app"
                        // sh "kubectl delete -n filetracker service express-app-service"
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    if(deploy==true){
                        echo "Niiice!!! Deploying ATQ now."
                    } else {
                        echo "Deploying aborted. Check and resolve the failing test and try again!"
                    }
                }
            }
        }
    }
}


// def waitForReport() {
//     timeout(time: 5, unit: 'MINUTES') {
//         script {
//             def counter = 0 
//             while (!fileExists('/var/jenkins_home/html/index.html')) {
//                 counter++ 
//                 echo "Waiting for index.html file to exist... (Attempt ${counter})"
//                 sleep 10 
//             }
//         }
//     }
// }


def fileExists(filePath) {
    return sh(script: "[ -f '$filePath' ]", returnStatus: true) == 0
}