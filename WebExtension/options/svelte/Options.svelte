<script>
import GeneralOptions from "./GeneralOptions.svelte";
import SubaccountsEditor from "./SubaccountsEditor.svelte";
import SyncStatus from "./SyncStatus.svelte";
import l10n from "../../l10nStore.esm.js";
</script>

<h1>{$l10n("subaccountsEditorHeader")}</h1>
<GeneralOptions/>
<h1>{$l10n("subaccountsEditorHeader")}</h1>
<SubaccountsEditor/>
<h1>{$l10n("syncHeader")}</h1>
<SyncStatus/>