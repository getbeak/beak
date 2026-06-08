# See docs/adr/0002-lexical-variable-input.md for the architectural rationale.

Feature: Variable input — typing, chip insertion, editing, clipboard

  As a Beak user editing any request field
  I want to interleave plain text and atomic variable references in one input
  So that I can compose URLs, headers, and bodies that resolve dynamically at flight time

  Background:
    Given a Variable Input is mounted with parts ["/users/", { type: "uuid", payload: { version: "v4" } }, "/profile"]
    And the variable registry contains "uuid", "nonce", "request_name", and a "variable_set_item" pointing at item "api-key-prod"

  # ---------- Caret and selection across chips ----------

  Scenario: The caret treats a chip as a single character
    Given the caret sits immediately before the chip
    When I press ArrowRight once
    Then the caret sits immediately after the chip
    And no part of the chip text is selected or focused

  Scenario: Backspace deletes a whole chip in one keystroke
    Given the caret sits immediately after the chip
    When I press Backspace
    Then the chip is removed from the editor
    And the resulting parts are ["/users/", "/profile"]

  Scenario: Selection across plain text and a chip survives copy
    Given the user selects from offset 0 of part 0 through offset 0 of part 2
    When I issue a copy
    Then the clipboard's "text/plain" content is "/users/<resolved-uuid>"
    And the clipboard's "application/x-lexical-editor" content describes one text node "/users/" and one variable chip of type "uuid"

  Scenario: Adjacent chips both keep an addressable caret position between them
    Given the parts are [{ type: "uuid", payload: {} }, { type: "nonce", payload: {} }]
    When I click between the two chips
    Then the caret lands between them
    And typing "x" produces parts [{ uuid }, "x", { nonce }]

  Scenario: Leading-chip backspace does nothing when the caret is at offset 0
    Given the parts are [{ type: "request_name", payload: {} }, "/edit"]
    And the caret sits at offset 0 of the leading chip
    When I press Backspace
    Then the chip is preserved
    And the parts are unchanged

  Scenario: Trailing-chip typing appends to plain text after the chip
    Given the parts are ["prefix-", { type: "nonce", payload: {} }]
    And the caret sits immediately after the trailing chip
    When I type "y"
    Then the parts become ["prefix-", { type: "nonce", payload: {} }, "y"]

  # ---------- Plain text + placeholder ----------

  Scenario: An empty input renders its placeholder until first input
    Given the parts are []
    Then the input renders the placeholder text in muted italics
    When I type "h"
    Then the placeholder is hidden
    And the parts become ["h"]

  Scenario: Typing within an existing text part edits in place
    Given the parts are ["/users/", { uuid }, "/profile"]
    When I place the caret at offset 7 of part 0 and type "v2"
    Then the parts become ["/users/v2", { uuid }, "/profile"]

  # ---------- "{" trigger and the variable selector ----------

  Scenario: Typing "{" opens the variable selector at the caret
    Given the parts are ["/users/"]
    And the caret is at the end of part 0
    When I type "{"
    Then the variable selector popover opens anchored under the caret
    And the search query is empty
    And the first matching variable is highlighted

  Scenario: Typing after "{" filters the suggestions
    Given the variable selector is open
    When I type "uui"
    Then the suggestion list filters to entries matching "uui" (case-insensitive)
    And "uuid" is the highlighted result

  Scenario: Enter inserts the highlighted variable and removes the trigger text
    Given the variable selector is open with query "uui"
    And "uuid" is highlighted
    When I press Enter
    Then the trigger text "{uui" is removed
    And a new chip { type: "uuid", payload: <createDefaultPayload result> } is inserted at the caret
    And the variable selector closes
    And the caret sits immediately after the new chip

  Scenario: Escape closes the selector without inserting
    Given the variable selector is open with query "uui"
    When I press Escape
    Then the selector closes
    And the trigger text "{uui" remains in the input verbatim

  Scenario: Whitespace in the query closes the selector
    Given the variable selector is open with query "uu"
    When I type " "
    Then the selector closes
    And the input contains the literal text "{uu "

  Scenario: Clicking outside the selector closes it without inserting
    Given the variable selector is open
    When I click on a region outside the selector and outside the input
    Then the selector closes
    And the input is unchanged

  Scenario: Variable-set items appear alongside built-ins
    Given a variable set "prod" exists with item "api-key-prod" valued "abc123"
    When I open the variable selector with query "api"
    Then the suggestion list includes "prod (abc123)" tagged as a variable-set item
    And inserting it produces a chip { type: "variable_set_item", payload: { itemId: "api-key-prod" } }

  Scenario: Extension-provided variables are tagged "Extension" in the selector
    Given an extension contributes a variable of type "jwt"
    When I open the variable selector
    Then the "jwt" suggestion shows an Extension badge
    And inserting it awaits the extension's createDefaultPayload before placing the chip

  # ---------- Click-a-chip → state modal ----------

  Scenario: Clicking an editable chip opens its state modal
    Given the parts contain a "uuid" chip whose variable definition has an editor
    When I click the chip
    Then the state-modal popover opens anchored to the chip
    And it shows the variable's name in the header
    And the form is pre-populated from the chip's payload

  Scenario: Saving the state modal mutates only that chip's payload
    Given the state-modal popover is open for the "uuid" chip at the second position
    When I change "version" from "v4" to "v1" and click Save
    Then the chip at the second position becomes { type: "uuid", payload: { version: "v1" } }
    And no other part is changed
    And the modal closes

  Scenario: The save callback addresses the chip by stable identity, not array position
    Given a "uuid" chip C is the third part in the editor
    And the user opens its state-modal popover
    When another transaction inserts a text node before C, shifting its array position
    And the user clicks Save in the modal
    Then C's payload is updated
    And no sibling part is mutated by mistake

  Scenario: Cancelling the state modal leaves the chip unchanged
    Given the state-modal popover is open for the "uuid" chip
    When I click Cancel
    Then the chip's payload is unchanged
    And the modal closes

  Scenario: Clicking a non-editable chip is a no-op
    Given a "nonce" chip whose variable definition has no editor
    When I click the chip
    Then no state-modal popover opens

  Scenario: Clicking a missing-extension chip is a no-op
    Given a chip references type "does_not_exist" with no matching variable definition
    Then the chip renders with the "missing" red tint
    When I click it
    Then no state-modal popover opens

  # ---------- Clipboard round-trip ----------

  Scenario: Copy/paste between two Variable Inputs preserves chip data
    Given Variable Input A has parts ["pre", { uuid }, "post"]
    And the user has selected the chip plus the surrounding text in A
    When the user copies A and pastes into Variable Input B (empty)
    Then B's parts become ["pre", { uuid }, "post"]
    And the uuid chip in B has the same payload as the chip in A

  Scenario: Copy a chip into a plain-text consumer yields the variable's display name
    Given Variable Input A has a "uuid" chip selected
    When the user copies and pastes into a non-Beak plain-text field
    Then the pasted text is the variable's display name, not "[object Object]"

  Scenario: Pasting from the legacy contenteditable shape still produces chips
    Given the user has clipboard HTML containing a legacy <div class="bvs-blob" data-type="uuid" data-payload="{...}">...</div>
    When the user pastes into a Variable Input
    Then the paste produces a chip { type: "uuid", payload: ... }

  Scenario: Pasting plain text without chips inserts text only
    Given Variable Input A is empty
    When the user pastes "https://example.com/users"
    Then A's parts become ["https://example.com/users"]

  Scenario: Pasting text containing newlines strips the newlines (single-line constraint)
    Given Variable Input A is empty
    When the user pastes "line1\nline2"
    Then A's parts become ["line1line2"]

  # ---------- Masking, missing variables, disabled/readOnly ----------

  Scenario: A masked input renders text with CSS text-security disc
    Given the input has mask=true
    And the parts are ["super-secret-token"]
    Then the visible characters are rendered as discs
    And the caret colour remains the accent pink
    And copying the selection still produces the plaintext value on the clipboard

  Scenario: A missing-extension chip renders with the alert tint
    Given a chip references type "does_not_exist"
    Then the chip wears the alert-red tint and a "missing" warning label
    And data-missing="true" on the chip's DOM

  Scenario: A disabled input refuses keyboard input
    Given the input has disabled=true
    When I type "x"
    Then the parts are unchanged

  Scenario: A readOnly input refuses keyboard input but allows selection
    Given the input has readOnly=true
    When I drag-select the chip and surrounding text
    Then the selection is highlighted
    When I copy the selection
    Then the clipboard contains the resolved text + the structured editor payload

  # ---------- Single-line constraint ----------

  Scenario: Enter does not insert a newline
    Given the caret sits at any position
    When I press Enter
    Then no newline is inserted
    And the parts are unchanged

  Scenario: Cmd/Ctrl+Enter triggers the global "execute request" shortcut
    Given the input is mounted inside a request editor
    When I press Cmd+Enter on macOS (Ctrl+Enter elsewhere)
    Then the pending change is flushed upstream synchronously
    And the global "execute request" action dispatches

  # ---------- Parity contract with the retired implementation ----------

  Scenario Outline: Every legacy call site keeps working post-cutover
    Given a Variable Input is mounted at "<call-site>"
    Then the input renders the existing parts
    And the variable selector opens on "{"
    And clicking an editable chip opens the state-modal popover

    Examples:
      | call-site                                                                  |
      | request-pane Header (HTTP headers row editor)                              |
      | request-pane PathParameters                                                |
      | request-pane URL field                                                     |
      | json-editor JsonStringEntry                                                |
      | json-editor JsonNumberEntry                                                |
      | variable-sets VariableCard (per-environment value editors)                 |
      | workflows NodePropertiesPanel                                              |
      | variables-editor state modal's nested value_parts_input UI section         |

  # ---------- Upstream sync (debounced) ----------

  Scenario: Local edits report upstream after a 50ms debounce
    Given the user is typing into an input
    When 50ms elapse with no further keystrokes
    Then onChange fires with the current parts

  Scenario: Upstream changes within 100ms of our last write are ignored
    Given the local editor just emitted onChange at time T
    When the parent component passes a new "parts" prop at time T + 50ms
    Then the editor does not snap to the new prop
    And keeps the user's mid-edit state

  Scenario: Upstream changes more than 100ms after our last write re-seed the editor
    Given the local editor last emitted onChange at time T
    When the parent component passes a new "parts" prop at time T + 200ms
    And that prop is structurally different from the editor's current state
    Then the editor re-seeds from the new prop
    And the previous mid-edit state is discarded
