pipeline {
    agent any
    
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
        stage('Git Checkout') {
            steps {
                script {
                    git branch: 'main',
                        credentialsId: '',
                        url: 'https://github.com/fidelis452/cypress-pipeline.git'
                }
            }
        }

        stage('Set up Kubectl') {
            steps {
                script {
                    withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {    

                        sh 'curl -LO "https://storage.googleapis.com/kubernetes-release/release/v1.20.5/bin/linux/amd64/kubectl"'
                        sh 'chmod u+x ./kubectl'
                        sh 'rm -f /var/jenkins_home/html/index.html' 

                    }
                }
            }
        }

        stage('Kill pods') {
            steps {
                // script {
                //     withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {    

                //         sh '''
                //         ./kubectl delete -n default deployment express-app
                //         ./kubectl delete -n default deployment ui-app
                //         '''
                //     }
                // }

                script {
                    withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {
                        // Check if the pod exists before attempting to delete it
                        def expressPodExists = sh(script: "./kubectl get pods -n default | grep express-app", returnStatus: true)
                        def uiPodExists = sh(script: "./kubectl get pods -n default | grep ui-app", returnStatus: true)
                        
                        // Delete the pod if it exists
                        if (expressPodExists == 0) {
                            sh "./kubectl delete -n default deployment express-app"
                        }
                        
                        if (uiPodExists == 0) {
                            sh "./kubectl delete -n default deployment ui-app"
                        }
                    }
            }
        }

        stage('Run Express Api') {
            steps {
                script {
                     withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {   

                        sh './kubectl apply -f express-api/kubernetes'

                        // Execute curl command and capture output
                        def statusOutput = sh(script: 'curl -s -o /dev/null -w "%{http_code}" http://express-app-service/students', returnStdout: true).trim()
                        
                        // Convert output to integer
                        statusCode = statusOutput.toInteger()
                        
                        // Check status code
                        if (statusCode == 200) {
                            echo "Status is 200 - OK"
                        } else {
                            echo "Status is not 200 - ${statusCode}"
                        }
                    }
                }
            }
        }


        stage('Run Ui App') {
            steps {
                script {
                     withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {                      
                        // Check status code
                        if (statusCode == 200) {
                            sh '''
                              ./kubectl apply -f ui-app/kubernetes

                                sleep 50
                              ./kubectl get pods
                            '''
                            
                        } else {
                            echo "Status is not 200 - ${statusCode}"
                        }
                    }
                }
            }
        }


        // stage('Run cypress') {
        //     steps {
        //         script {
        //              withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {                      
        //                 // Check status code
        //                 if (statusCode == 200) {
        //                     sh '''
        //                       ./kubectl apply -f cypress-tests/kubernetes

        //                         sleep 50
        //                       ./kubectl get pods -n jenkins
        //                     '''
                            
        //                 } else {
        //                     echo "Status is not 200 - ${statusCode}"
        //                 }
        //             }
        //         }
        //     }
        // }

        // stage('Get Pod Names') {
        //     steps {
        //         script {
        //              withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {                      
        //                 jenkinsPod = sh(script: './kubectl get pods -n default -l app=jenkins -o jsonpath="{.items[0].metadata.name}"', returnStdout: true).trim()
        //                 echo "Found pod name: $jenkinsPod"
        //                 cypressPod = sh(script: "./kubectl get pods -n default -l job-name=e2e-test-app-job -o jsonpath='{.items[0].metadata.name}'", returnStdout: true).trim()
        //                 echo "Found Cypress pod name: $cypressPod"
        //             }
        //         }
        //     }
        // }

        // stage('Wait for tests to run and report generation') {
        //     steps {
        //         script {
        //             withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {
        //             waitForReport()
        //             sh "./kubectl exec -n default $jenkinsPod -- cat /var/jenkins_home/html/index.html > report.html"
        //             archiveArtifacts artifacts: 'report.html', onlyIfSuccessful: true
        //             }
        //         }
        //     }
        // }
        

        // stage('Deciding deployment and stopping testing pods') {
        //     steps {
        //         script {
        //             withKubeCredentials(kubectlCredentials: [[caCertificate: '', clusterName: 'minikube', contextName: '', credentialsId: 'cypress-secret-token', namespace: 'default', serverUrl: 'https://192.168.49.2:8443']]) {

        //                 // Run kubectl logs command and store the output
        //                 logs = sh(script: "./kubectl logs -n default $cypressPod -c e2e-test-app", returnStdout: true).trim()

        //                 // Check if the text "all specs passed" is present in the logs
        //                 if (logs.contains("all specs passed")) {
        //                     echo "Specs passed: true \n Proceeding to deployment"
        //                     deploy = true
        //                 } else {
        //                     echo "some tests failed...Check the report for issues \n Deployment aborted"
        //                 }

        //                 //kill the created pods and service.

        //                 sh "./kubectl delete -n default deployment express-app"
        //                 sh "./kubectl delete -n default deployment ui-app"
        //                 sh "./kubectl delete -n default job e2e-test-app-job"
        //                 sh "./kubectl delete -n default service ui-app"
        //                 sh "./kubectl delete -n default service express-app-service"
        //             }
        //         }
        //     }
        // }

        // stage('Deploy') {
        //     steps {
        //         script {
        //             if(deploy==true){
        //                 echo "Niiice!!! Deploying ATQ now."
        //             } else {
        //                 echo "Deploying aborted. Check and resolve the failing test and try again!"
        //             }
        //         }
        //     }
        // }

    }
}

def waitForReport() {
    timeout(time: 5, unit: 'MINUTES') {
        script {
            def counter = 0 
            while (!fileExists('/var/jenkins_home/html/index.html')) {
                counter++ 
                echo "Waiting for index.html file to exist... (Attempt ${counter})"
                sleep 10 
            }
        }
    }
}


def fileExists(filePath) {
    return sh(script: "[ -f '$filePath' ]", returnStatus: true) == 0
}