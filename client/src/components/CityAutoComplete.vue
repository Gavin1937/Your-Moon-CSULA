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

const emits = defineEmits(["updateCity"]);

const state = reactive({
  inputValue: props.initialValue,
  suggestions: [],
  isOpen: false,
  arrowCounter: -1,
});

function produceSuggestions() {
  state.suggestions = [
    ...new Set(
      props.dataArray.filter((item) => {
        return (
          item.city.substr(0, state.inputValue.length).toUpperCase() ==
          state.inputValue.toUpperCase()
        );
      })
    ),
  ].slice(0, 10);
}

function setInputValue(value) {
  state.inputValue = value;
  emits("updateCity", value);
  state.isOpen = false;
}

function onChange() {
  emits("updateCity", state.inputValue);
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
  state.inputValue = state.suggestions[state.arrowCounter].city;
  emits("updateCity", state.inputValue);
  state.arrowCounter--;
  state.isOpen = false;
}
</script>

<template>
  <div class="autocomplete">
    <label class="labelHeader">Nearest City</label>
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
        @click="setInputValue(suggestion.city)"
        :class="{ 'is-active': i === state.arrowCounter }"
      >
        {{ suggestion.city }}
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
