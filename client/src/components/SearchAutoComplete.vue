<template>
  <div class="autocomplete">
    <label v-if="propertyToFilterBy === 'city'">Nearest City</label>
    <label v-else>Country Code</label>
    <input
      type="text"
      v-model="search"
      @input="onChange"
      @keydown.down="onArrowDown"
      @keydown.up="onArrowUp"
      @keydown.enter="onEnter"
    />
    <ul class="autocomplete-results" v-show="isOpen">
      <li
        class="autocomplete-result"
        v-for="(result, i) in results"
        :key="i"
        @click="setResult(result[propertyToFilterBy])"
        :class="{ 'is-active': i === arrowCounter }"
      >
        {{ result[propertyToFilterBy] }}
      </li>
    </ul>
  </div>
</template>

<style>
.autocomplete {
  position: relative;
}

.autocomplete-results {
  padding: 0;
  margin: 0;
  border: 1px solid #eeeeee;
  height: 120px;
  min-height: 1em;
  max-height: 6em;
  overflow: auto;
}

.autocomplete-result {
  list-style: none;
  text-align: left;
  padding: 4px 2px;
  cursor: pointer;
}
.autocomplete-result.is-active,
.autocomplete-result:hover {
  background-color: #4aae9b;
  color: white;
}
</style>

<script>
export default {
  name: "SearchAutocomplete",
  props: {
    items: {
      type: Array,
      required: true,
      default: () => [],
    },
    propertyToFilterBy: {
      type: String,
      required: true,
    },
    searchInitialValue: {
      type: String,
      required: false,
    },
  },
  mounted() {
    document.addEventListener("click", this.handleClickOutside);
    this.search = this.searchInitialValue;
  },
  destroyed() {
    document.removeEventListener("click", this.handleClickOutside);
  },
  data() {
    return {
      search: this.searchInitialValue,
      results: [],
      isOpen: false,
      arrowCounter: -1,
    };
  },
  methods: {
    filterResults() {
      this.results = this.items.filter((item) => {
        return (
          item[this.propertyToFilterBy] &&
          item[this.propertyToFilterBy]
            .substr(0, this.search.length)
            .toLowerCase() === this.search.toLowerCase()
        );
      });
      // .slice(0, 10);
    },
    onChange() {
      // Emit an event to notify the parent about the search value
      this.$emit("update:search", this.search);
      this.filterResults();
      this.isOpen = true;
    },
    setResult(result) {
      this.search = result;
      // Emit an event to notify the parent about the search value
      this.$emit("update:search", this.search);
      this.isOpen = false;
    },
    handleClickOutside(event) {
      if (!this.$el.contains(event.target)) {
        this.arrowCounter = -1;
        this.isOpen = false;
      }
    },
    onArrowDown() {
      if (this.arrowCounter < this.results.length) {
        this.arrowCounter = this.arrowCounter + 1;
      }
    },
    onArrowUp() {
      if (this.arrowCounter > 0) {
        this.arrowCounter = this.arrowCounter - 1;
      }
    },
    onEnter() {
      this.search = this.results[this.arrowCounter][this.propertyToFilterBy];
      // Emit an event to notify the parent about the search value
      this.$emit("update:search", this.search);
      this.arrowCounter = -1;
      this.isOpen = false;
    },
  },
};
</script>
