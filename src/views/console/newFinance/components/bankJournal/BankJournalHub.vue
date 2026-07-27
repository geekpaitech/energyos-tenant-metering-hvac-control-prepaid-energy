<template>
  <div class="bank-journal-hub">
    <bank-journal-tenant-tab />
  </div>
</template>

<script>
import BankJournalTenantTab from './BankJournalTenantTab.vue'

export default {
  name: 'BankJournalHub',
  components: {
    BankJournalTenantTab
  }
}
</script>

<style lang="scss" scoped>
.bank-journal-hub {
  margin-top: 0;
}
</style>
