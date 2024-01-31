<script setup>
import { reactive } from "vue";

const props = defineProps({
  dataArray: {
    type: Array,
    required: true,
  },

  initialValue: {
    type: String,
    required: false,
  },
});

const emits = defineEmits(["updateCountry"]);

const state = reactive({
  inputValue: props.initialValue,
  suggestions: [],
  isOpen: false,
  arrowCounter: -1,
});

function produceSuggestions() {
  state.suggestions = props.dataArray
    .filter((item) => {
      return (
        item.name.substr(0, state.inputValue.length).toUpperCase() ==
        state.inputValue.toUpperCase()
      );
    })
    .slice(0, 10);
}

function setInputValue(value) {
  state.inputValue = value;
  emits("updateCountry", state.inputValue);
  state.isOpen = false;
}

function onChange() {
  produceSuggestions();
  state.isOpen = true;
}

function onArrowDown() {
  if (state.arrowCounter < state.suggestions.length) state.arrowCounter++;
}

function onArrowUp() {
  if (state.arrowCounter > 0) state.arrowCounter--;
}

function onEnter() {
  emits("updateCountry", state.inputValue);
  state.inputValue = state.suggestions[state.arrowCounter].name;
  state.arrowCounter--;
  state.isOpen = false;
}
</script>
<template>
  <div class="autocomplete">
    <label class="labelHeader">Country</label>
    <input
      type="text"
      v-model="state.inputValue"
      @input="onChange"
      @keydown.down="onArrowDown"
      @keydown.up="onArrowUp"
      @keydown.enter="onEnter"
    />
    <ul class="autocomplete-results" v-show="state.isOpen">
      <li
        class="autocomplete-result"
        v-for="(suggestion, i) in state.suggestions"
        :key="i"
        @click="setInputValue(suggestion.name)"
        :class="{ 'is-active': i === state.arrowCounter }"
      >
        {{ suggestion.name }}
      </li>
    </ul>
  </div>
</template>
<style>
.labelHeader{
  display:flex;
  flex-direction:column;
}

.autocomplete {
  position: relative;
}

.autocomplete-results {
  padding: 0;
  margin: 0;
  border: 1px solid #eeeeee;
  height: auto;
  width: 246px;
  min-height: 1em;
  max-height: 10em;
  overflow: auto;
}

.autocomplete-result {
  list-style: none;
  text-align: left;
  padding: 4px 2px;
  cursor: pointer;
  font-size: .8em;
  width:100%;
  height: auto;
}
.autocomplete-result.is-active,
.autocomplete-result:hover {
  background-color: #4aae9b;
  color: white;
}
</style>
