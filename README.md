# GenVote: Customizable and Secure Voting Platform using Ethereum Blockchain
## **Description:**
Electronic voting has been popularized in recent years as an alternative to traditional voting. Even though electronic voting addresses the problems that traditional voting brings, it is not a perfect solution. Electronic voting brings its own set of concerns which include: election fraud, voter privacy, data integrity, and confidentiality. To ensure fairness in electronic voting, a centralized system is required and the complete process has to be overseen by an authority. Due to these requirements it can be very expensive to roll-out on a large scale during every voting period. Blockchain, the distributed data structure popularized by Bitcoin, can be integrated into electronic voting systems to alleviate some the problems involved with them while being cost-effective. With the use of blockchain, we propose a voting system that is easily accessible, customizable, transparent, and in-expensive. GenVote is a distributed electronic voting system that utilizes Ethereum Blockchain, smart contracts, and homomorphic encryption to achieve a transparent voting process with non-authority based tallying and voter privacy. GenVote also allows the ballot creation and voting process to be customizable with different types of ballots and logic based voting. GenVote is currently a viable solution for university-scaled elections and has been deployed on Ethereum Ropsten testing network to evaluate its viability and scalability as an electronic voting system.

## **Requirements for compiling and interacting with the Voting DApp:**

### **Operating System**:
Ubuntu 16.xx or higher (make sure to update your OS)

### **Packages**: 
1. Open a terminal (make sure you have permissions to download and install packages)
2. Run these commands to install git, nodejs, npm, and truffle framework
```bash
sudo apt-get install git
sudo apt install nodejs
sudo apt-get install npm
sudo apt-get install build-essential
sudo npm install -g truffle
```

### **The voting DApp itself**:
Go to the directory you want to download the app into:
```bash
git clone https://github.com/pmarella2/GenVote.git GenVote
```
*Alternatively you can click [here](https://github.com/pmarella2/GenVote/archive/master.zip)*

### **Steps to compile and host the voting DApp**:
1. Change into GenVote directory
```bash
cd GenVote
```
2. Open two new terminals in the project directory (so you should have three different terminals in the GenVote directory)
3. In terminal 3, run the nodejs component of GenVote
```bash
cd app/javascripts
node node.js
```
4. In terminal 2, run the virtual memory blockchain (testrpc/ganache-cli)
```bash
./node_modules/.bin/ganache-cli
```
5. In terminal 1, we will compile the voting smart contracts and deploy them onto the virtual memory blockchain
```bash
truffle migrate
```
6. In terminal 1 again, we will host the voting DApp
 ```bash
npm run dev
```

### **Interacting with the voting DApp**:
1. You can now interact with the DApp by navigating to *localhost:8080* in your choice of browser

## **Troubleshoothing:**
Open an issue if there are any problems with compiling and running the DApp

## **Acknowledgements:**
I want to thank the ISPM research lab for providing the resources to extend my previous research project.