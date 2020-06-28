<template>
  <div>
    <button v-on:click="newNode">New Transaction</button>
    <div v-if="node.isInCreation">
      <select v-model="node.selectedLabel">
        <option
          v-for="existingLabel in node.existingLabels"
          :key="existingLabel"
          :value="existingLabel"
        >{{existingLabel}}</option>
      </select>
    </div>
  </div>
</template>

<script>
import {openTransaction,loadExistingNodeLabels}  from  '../_services/neo4j.service'
export default {
  name: "NodeCreator",
  props: {
    msg: String
  },
  data() {
    return {
      neo4jConfig: { transactionRouteUrl: "http://localhost:7474/db/neo4j/tx" },
      transaction: { commitUrl: null, url: null, running: false },
      node: { isInCreation: false, existingLabels: [], selectedLabel: null }
    };
  },
  methods: {
    newNode() {
      const component = this;
      component.node.isInCreation = true;
      openTransaction(this.neo4jConfig.transactionRouteUrl).then(({commitUrl,url}) => {
        component.transaction.commitUrl = commitUrl
        component.transaction.running=true
        component.transaction.url=url
        console.log("Transaction created : ", component.transaction.url);
        
        // fetch labels
        loadExistingNodeLabels(component.transaction.url)
        .then(data => {
          component.node.existingLabels = data;
        });
      })
      .catch(()=>{
          component.transaction.running = true; // to refresh transaction while it is running
          component.isInCreation=false
      })
    },
    commitNode() {
      // endTransaction
    },
  }
};
</script>


<style>
</style>