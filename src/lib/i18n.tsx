import { createContext, useContext, useState, type ReactNode } from 'react';

export type Lang = 'es' | 'en' | 'pt';
export const LANGS: Lang[] = ['es', 'en', 'pt'];

// ── Translations ──────────────────────────────────────────────────────────────

const T = {
  es: {
    // Common
    cancel: 'Cancelar', yes: 'Sí', no: 'No', none: 'Ninguno',
    optional: 'opcional', edit_hint: 'editar',

    // Config bar
    bot_token_mode: 'Bot Token', webhook_mode: 'Webhook',
    bot_token_label: 'Bot Token', channel_id: 'Channel ID',
    webhook_url: 'Webhook URL',
    webhook_no_preview: 'El preview del bot no aparece en modo webhook.',
    thread_id: 'THREAD ID', message_id: 'MESSAGE ID',
    thread_placeholder: 'ID del hilo…', msg_placeholder: 'ID o URL…',
    reply_to: 'RESPONDER A', reply_placeholder: 'ID del mensaje a responder…',
    restore_btn: '↩ Restaurar', edit_btn: '✏ Editar mensaje',

    // Header – V2
    embed_normal_btn: 'Embed normal', badge_soon: 'Pronto',
    pings_on: 'Pings ON', pings_off: 'Pings OFF',
    export_btn: 'Exportar', clear_btn: 'Limpiar',
    send_btn: 'Enviar', sending_btn: 'Enviando…',
    char_counter_title: 'Texto en Msg {0} (límite Discord: {1} chars)',

    // Toolbar
    add_to_root: 'Agregar al root',
    toolbar_in_container: 'Agregar en container',
    toolbar_in_row: 'Agregar en row',
    comp_text: 'Texto', comp_section: 'Section', comp_gallery: 'Gallery',
    comp_divider: 'Divider', comp_container: 'Container', comp_row: 'Row',
    comp_button: 'Botón', comp_select_text: 'Select texto',
    comp_select_roles: 'Select roles', comp_select_users: 'Select usuarios',
    comp_select_mentions: 'Select menciones', comp_select_channels: 'Select canales',

    // Panel headers
    messages_label: 'Mensajes',
    add_message_btn: 'Nuevo mensaje',
    panel_tree: 'Árbol · Msg {0}',
    panel_props: 'Propiedades',
    props_empty: 'Selecciona un componente para editarlo.',
    props_editing: 'Editando:',

    // ActionRow warning
    row_webhook_warn: 'Los Action Rows necesitan Bot Token para funcionar. Los selects de roles/usuarios/canales/menciones no se pueden enviar via webhook.',

    // Status bar
    status_ready: 'Listo',
    status_msg: 'Msg {0}/{1} · {2} comp.',

    // Security modal
    security_title: '¿Realmente quieres hacer esto?',
    security_label_token: 'Token de bot de Discord',
    security_label_webhook: 'URL de Webhook de Discord',
    security_desc_token: 'Estás a punto de ingresar el token de tu bot. Esta credencial permite controlar el bot completamente. Nunca compartas tu token con nadie.',
    security_desc_webhook: 'Estás a punto de ingresar una URL de webhook. Esta URL permite publicar mensajes en el canal vinculado sin autenticación adicional.',
    security_local: 'Tu credencial se guarda localmente en tu navegador (localStorage) y se envía directamente a Discord — nunca a servidores externos. Esta app corre en local.',
    security_confirm: 'Sí, continuar →',

    // Coming soon modal
    cs_title: 'Próximamente', cs_sub: 'Embeds normales de Discord',
    cs_desc: 'El soporte para embeds normales (tipo 0, con campos, imagen, footer, author…) está en desarrollo.',
    cs_tip: 'Por ahora usa Components V2 (Containers, Secciones, Galerías, etc.) que ofrecen mucho más control visual.',
    cs_ok: 'Entendido',

    // Toasts / errors – V2
    toast_added: '{0} agregado',
    toast_removed: 'Componente eliminado',
    toast_duplicated: 'Componente duplicado',
    toast_msg_added: 'Mensaje nuevo agregado',
    toast_msg_removed: 'Mensaje {0} eliminado',
    toast_pings_on: 'Pings activados', toast_pings_off: 'Pings desactivados',
    toast_cleared: 'Componentes eliminados', toast_exported: 'JSON exportado',
    toast_restored: 'Mensaje restaurado', toast_edited: 'Mensaje editado',
    toast_sent: 'Mensaje enviado', toast_sent_multi: '{0} mensajes enviados',
    err_min_msg: 'Debe haber al menos un mensaje',
    err_empty_token: 'Falta el token o el Channel ID',
    err_empty_webhook: 'Falta la URL del webhook',
    err_invalid_webhook: 'URL de webhook inválida',
    err_empty_msg: 'Msg {0} está vacío — agrega componentes o elimínalo.',
    err_dynamic_sel: 'Los selects de roles/usuarios/canales/menciones solo funcionan en modo Bot Token.',
    err_no_msg_id: 'Ingresa un Message ID o URL',
    err_no_components: 'El mensaje no tiene componentes',
    confirm_clear_one: '¿Eliminar todos los componentes?',
    confirm_clear_msg: '¿Eliminar todos los componentes del Msg {0}?',
    confirm_del_msg: '¿Eliminar Mensaje {0}?',

    // PropertyEditor
    pe_content: 'Contenido',
    pe_spacing: 'Espaciado', pe_sp_normal: 'Normal (1)', pe_sp_large: 'Grande (2)',
    pe_divider_visible: 'Línea visible',
    pe_image_url: 'URL de imagen', pe_alt: 'Descripción (alt)',
    pe_accessory: 'Accesorio', pe_accessory_none: 'Ninguno', pe_accessory_btn: 'Botón',
    pe_accessory_edit: 'Selecciona el accesorio en el árbol para editarlo.',
    pe_gallery_images: 'Imágenes ({0}/10)', pe_gallery_add: '+ Agregar',
    pe_image_n: 'Imagen {0}', pe_description: 'Descripción',
    pe_btn_label: 'Texto', pe_btn_style: 'Estilo',
    pe_btn_url: 'URL', pe_btn_custom_id: 'Custom ID',
    pe_btn_emoji: 'Emoji (nombre)', pe_btn_disabled: 'Deshabilitado',
    pe_sel_type: 'Tipo de select',
    pe_sel_hint_3: 'El usuario elige de una lista de opciones que tú defines.',
    pe_sel_hint_5: 'Muestra miembros del servidor para seleccionar.',
    pe_sel_hint_6: 'Muestra roles del servidor. El bot puede asignar/quitar roles con la interacción.',
    pe_sel_hint_7: 'Usuarios y roles combinados.',
    pe_sel_hint_8: 'Muestra canales del servidor para seleccionar.',
    pe_sel_role_warn: 'El bot necesita código para asignar/quitar roles al interactuar.',
    pe_sel_custom_id: 'Custom ID', pe_sel_placeholder: 'Placeholder',
    pe_sel_min: 'Mín.', pe_sel_max: 'Máx.',
    pe_opts_title: 'Opciones ({0}/25)', pe_opts_add: '+ Agregar',
    pe_opt_n: 'Opción {0}', pe_opt_label: 'Label', pe_opt_value: 'Value',
    pe_opt_warn: '⚠ Necesita al menos 1 opción para enviarse.',
    pe_row_conflict: '⚠ No puede tener botones y select menu al mismo tiempo. Elimina uno de los tipos.',
    pe_row_hint: 'Usa el "+" en el árbol para agregar botones o select menus.',
    pe_row_rule: 'Regla: máx. 5 botones OR 1 select menu por Action Row.',
    pe_accent_color: 'Accent color', pe_no_color: 'Sin color',
    pe_spoiler: 'Spoiler', pe_cont_sel_placeholder_rol: 'Seleccionar rol…',
    pe_cont_sel_placeholder_user: 'Seleccionar usuario…',

    // EmbedBuilder header
    eb_title: 'Embed Builder', eb_back: '← V2',
    eb_sending: 'Enviando…', eb_send: 'Enviar', eb_export: 'Exportar',
    eb_ready: 'Listo',

    // EmbedBuilder config
    eb_username: 'Username override', eb_avatar: 'Avatar override (URL)',
    eb_msg_id_hint: 'vacío = nuevo mensaje',

    // EmbedBuilder messages / embeds
    eb_message: 'Mensaje {0}',
    eb_add_message: 'Añadir mensaje ({0}/10)',
    eb_content: 'Contenido del mensaje',
    eb_content_ph: 'Texto visible sobre el embed — @menciones, **bold**, :emojis:…',
    eb_add_embed: 'Añadir embed ({0}/10)',
    eb_no_title: 'Sin título',
    eb_color: 'Color de acento',
    eb_no_color: '∅ Sin color',
    eb_author: 'Autor', eb_author_name: 'Nombre',
    eb_author_url: 'URL del nombre', eb_author_icon: 'URL del ícono',
    eb_title_f: 'Título', eb_title_url: 'URL del título',
    eb_title_url_hint: 'https://... (el título se vuelve clickeable)',
    eb_description: 'Descripción',
    eb_desc_ph: 'Markdown, @menciones, :emojis:, links…',
    eb_fields: 'Campos ({0}/25)', eb_field_n: 'CAMPO {0}',
    eb_add_field: 'Añadir campo', eb_inline: 'inline',
    eb_field_name_ph: 'Nombre del campo',
    eb_field_value_ph: 'Valor — soporta markdown',
    eb_images: 'Imágenes', eb_image: 'Imagen principal', eb_thumbnail: 'Thumbnail',
    eb_footer: 'Footer', eb_footer_text: 'Texto del footer',
    eb_footer_icon: 'URL del ícono',
    eb_timestamp: 'Incluir timestamp (fecha/hora actual)',
    eb_ansi: 'Texto de color (ANSI)',
    eb_ansi_tip: 'Usa bloques',

    // EmbedBuilder toasts / errors
    eb_no_content: 'No hay contenido para enviar',
    eb_max_embeds: 'Máximo 10 embeds', eb_max_msgs: 'Máximo 10 mensajes',
    eb_max_fields: 'Máximo 25 campos',
    eb_only_one_edit: 'Solo 1 mensaje al editar. Elimina los demás o quita el Message ID.',
    eb_sent: 'Enviado (ID: {0})', eb_edited_ok: 'Editado (ID: {0})',
    eb_sent_multi: '{0} mensajes enviados', eb_exported: 'JSON exportado',
    eb_confirm_embed: '¿Eliminar embed?', eb_confirm_msg: '¿Eliminar mensaje?',
    eb_err_webhook: 'Falta la URL del webhook',
    eb_err_webhook_invalid: 'URL del webhook inválida',
    eb_err_creds: 'Falta el token o el Channel ID',

    // Webhook manager
    wm_title: 'Webhooks guardados',
    wm_save_current: 'Guardar webhook actual',
    wm_name_placeholder: 'Nombre (ej: #general)',
    wm_saved: 'Webhook guardado',
    wm_deleted: 'Webhook eliminado',
    wm_empty: 'No hay webhooks guardados',
    wm_select_placeholder: 'Cargar webhook guardado…',

    // Validation errors
    val_total_chars: 'Texto total demasiado largo: {0} chars (límite {1}). Reducí el contenido.',
    val_empty_text: 'Hay un nodo de Texto vacío — escribí algo o eliminalo.',
    val_text_too_long: 'Texto demasiado largo ({0} chars). Discord permite máximo {1} por nodo.',
    val_thumb_no_url: 'Hay un Thumbnail sin URL — agrega una URL de imagen o eliminalo.',
    val_gallery_no_url: 'Gallery: el item {0} no tiene URL de imagen.',
    val_row_empty: 'Hay un Action Row vacío — agrega al menos 1 botón o select menu.',
    val_row_conflict: 'Un Action Row no puede tener botones Y select menu al mismo tiempo.',
    val_row_one_sel: 'Un Action Row solo puede tener 1 select menu.',
    val_row_max_btns: 'Un Action Row puede tener máximo 5 botones.',
    val_sel_no_opts: 'Select Menu de texto necesita al menos 1 opción (ID: {0}).',
    val_sel_no_id: 'Select Menu de texto necesita un Custom ID.',
    val_dyn_sel_no_id: 'Select menu necesita un Custom ID.',
    val_btn_no_id: 'Botón "{0}" necesita un Custom ID.',
    val_btn_link_no_url: 'Botón link "{0}" necesita una URL.',

    // Status bar embed builder
    eb_sb_msg: '{0} msg', eb_sb_msgs: '{0} msgs',
    eb_sb_embed: '{0} embed', eb_sb_embeds: '{0} embeds',

    // Copy link
    copy_link: 'Copiar link', copy_link_ok: 'Link copiado al portapapeles',

    // Compact mode
    compact_all: 'Colapsar todo', expand_all: 'Expandir todo',

    // Format toolbar
    fmt_bold: 'Negrita', fmt_italic: 'Cursiva', fmt_underline: 'Subrayado',
    fmt_strike: 'Tachado', fmt_code: 'Código inline', fmt_codeblock: 'Bloque de código',
    fmt_spoiler: 'Spoiler', fmt_quote: 'Cita',

    // Send history
    hist_title: 'Historial de envíos', hist_empty: 'No hay envíos recientes',
    hist_clear: 'Limpiar historial', hist_copy_id: 'Copiar ID',
    hist_id_copied: 'ID copiado', hist_load: 'Cargar como Message ID',

    // Templates
    tmpl_title: 'Plantillas', tmpl_save: 'Guardar como plantilla',
    tmpl_name_ph: 'Nombre de plantilla…', tmpl_saved: 'Plantilla guardada',
    tmpl_loaded: 'Plantilla cargada', tmpl_deleted: 'Plantilla eliminada',
    tmpl_empty: 'No hay plantillas guardadas',
    tmpl_confirm_load: '¿Cargar plantilla? Se reemplazará el contenido actual.',
    tmpl_confirm_delete: '¿Eliminar esta plantilla?',

    // Import
    import_title: 'Importar desde Discord',
    import_json_ph: 'Pegá el JSON del mensaje aquí…',
    import_btn: 'Importar', import_ok: 'Importado correctamente',
    import_err: 'JSON inválido o formato no reconocido',
    import_hint: 'Pegá el payload JSON de un mensaje de Discord. Soporta embeds, content y username/avatar.',

    // Link buttons (embed builder)
    eb_link_btns: 'Botones de link ({0}/{1})',
    eb_add_row: '+ Fila de botones',
    eb_add_link_btn: '+ Botón',
    eb_btn_label_ph: 'Texto del botón',
    eb_btn_url_ph: 'https://...',
    eb_btn_row_n: 'Fila {0}',
    eb_btn_n: 'Botón {0}',
    eb_btn_emoji_ph: 'emoji (opcional)',
    eb_max_rows: 'Máximo 5 filas de botones',
    eb_max_btns_row: 'Máximo 5 botones por fila',

    // Diff
    diff_title: 'Cambios detectados', diff_no_changes: 'Sin cambios respecto al original',

    // Theme
    theme_light: 'Modo claro', theme_dark: 'Modo oscuro',

    // Export PNG
    export_png: 'Exportar PNG',

    // Webhook Appearance Modal
    wh_appearance_title: 'Apariencia del Webhook',
    wh_appearance_sub: 'Configura cómo aparece el bot en el preview y en el mensaje enviado.',
    wh_appearance_preview_msg: 'Este es un mensaje de ejemplo.',
    wh_appearance_loading: 'Obteniendo info del webhook…',
    wh_appearance_real: 'bot real del webhook',
    wh_appearance_use_real: 'Usar real',
    wh_appearance_no_url: 'Ingresa una URL de webhook válida para obtener la info del bot.',
    wh_appearance_save: 'Guardar',
    wh_appearance_btn: 'Apariencia',

    // Mention/Time/Emoji Picker
    picker_mentions: 'Menciones', picker_time: 'Tiempo', picker_emojis: 'Emojis',
    picker_add: 'Agregar canal o rol', picker_name_ph: 'Nombre (opcional)',
    picker_save_mention: 'Guardar mención',
    picker_date: 'Fecha', picker_time_label: 'Hora',
    picker_emoji_search: 'Buscar emoji…',
  },
  en: {
    cancel: 'Cancel', yes: 'Yes', no: 'No', none: 'None',
    optional: 'optional', edit_hint: 'edit',

    bot_token_mode: 'Bot Token', webhook_mode: 'Webhook',
    bot_token_label: 'Bot Token', channel_id: 'Channel ID',
    webhook_url: 'Webhook URL',
    webhook_no_preview: 'Bot preview is not available in webhook mode.',
    thread_id: 'THREAD ID', message_id: 'MESSAGE ID',
    thread_placeholder: 'Thread ID…', msg_placeholder: 'ID or URL…',
    reply_to: 'REPLY TO', reply_placeholder: 'Message ID to reply to…',
    restore_btn: '↩ Restore', edit_btn: '✏ Edit message',

    embed_normal_btn: 'Normal Embed', badge_soon: 'Soon',
    pings_on: 'Pings ON', pings_off: 'Pings OFF',
    export_btn: 'Export', clear_btn: 'Clear',
    send_btn: 'Send', sending_btn: 'Sending…',
    char_counter_title: 'Text in Msg {0} (Discord limit: {1} chars)',

    add_to_root: 'Add to root',
    toolbar_in_container: 'Add in container',
    toolbar_in_row: 'Add in row',
    comp_text: 'Text', comp_section: 'Section', comp_gallery: 'Gallery',
    comp_divider: 'Divider', comp_container: 'Container', comp_row: 'Row',
    comp_button: 'Button', comp_select_text: 'Text select',
    comp_select_roles: 'Role select', comp_select_users: 'User select',
    comp_select_mentions: 'Mention select', comp_select_channels: 'Channel select',

    messages_label: 'Messages',
    add_message_btn: 'New message',
    panel_tree: 'Tree · Msg {0}',
    panel_props: 'Properties',
    props_empty: 'Select a component to edit its properties.',
    props_editing: 'Editing:',

    row_webhook_warn: 'Action Rows require Bot Token to work. Role/user/channel/mention selects cannot be sent via webhook.',

    status_ready: 'Ready',
    status_msg: 'Msg {0}/{1} · {2} comp.',

    security_title: 'Are you sure?',
    security_label_token: 'Discord Bot Token',
    security_label_webhook: 'Discord Webhook URL',
    security_desc_token: 'You are about to enter your bot token. This credential allows full control of your bot. Never share your token with anyone.',
    security_desc_webhook: 'You are about to enter a webhook URL. This URL allows posting messages in the linked channel without additional authentication.',
    security_local: 'Your credentials are stored locally in your browser (localStorage) and sent directly to Discord — never to external servers. This app runs locally.',
    security_confirm: 'Yes, continue →',

    cs_title: 'Coming Soon', cs_sub: 'Normal Discord Embeds',
    cs_desc: 'Support for normal embeds (type 0, with fields, image, footer, author…) is in development.',
    cs_tip: 'For now, use Components V2 (Containers, Sections, Galleries, etc.) which offer much more visual control.',
    cs_ok: 'Got it',

    toast_added: '{0} added',
    toast_removed: 'Component deleted',
    toast_duplicated: 'Component duplicated',
    toast_msg_added: 'New message added',
    toast_msg_removed: 'Message {0} deleted',
    toast_pings_on: 'Pings enabled', toast_pings_off: 'Pings disabled',
    toast_cleared: 'Components cleared', toast_exported: 'JSON exported',
    toast_restored: 'Message restored', toast_edited: 'Message edited',
    toast_sent: 'Message sent', toast_sent_multi: '{0} messages sent',
    err_min_msg: 'There must be at least one message',
    err_empty_token: 'Missing token or Channel ID',
    err_empty_webhook: 'Missing webhook URL',
    err_invalid_webhook: 'Invalid webhook URL',
    err_empty_msg: 'Msg {0} is empty — add components or delete it.',
    err_dynamic_sel: 'Role/user/channel/mention selects only work in Bot Token mode.',
    err_no_msg_id: 'Enter a Message ID or URL',
    err_no_components: 'Message has no components',
    confirm_clear_one: 'Delete all components?',
    confirm_clear_msg: 'Delete all components from Msg {0}?',
    confirm_del_msg: 'Delete Message {0}?',

    pe_content: 'Content',
    pe_spacing: 'Spacing', pe_sp_normal: 'Normal (1)', pe_sp_large: 'Large (2)',
    pe_divider_visible: 'Visible line',
    pe_image_url: 'Image URL', pe_alt: 'Description (alt)',
    pe_accessory: 'Accessory', pe_accessory_none: 'None', pe_accessory_btn: 'Button',
    pe_accessory_edit: 'Select the accessory in the tree to edit it.',
    pe_gallery_images: 'Images ({0}/10)', pe_gallery_add: '+ Add',
    pe_image_n: 'Image {0}', pe_description: 'Description',
    pe_btn_label: 'Label', pe_btn_style: 'Style',
    pe_btn_url: 'URL', pe_btn_custom_id: 'Custom ID',
    pe_btn_emoji: 'Emoji (name)', pe_btn_disabled: 'Disabled',
    pe_sel_type: 'Select type',
    pe_sel_hint_3: 'User picks from a custom list of options you define.',
    pe_sel_hint_5: 'Shows server members to select.',
    pe_sel_hint_6: 'Shows server roles. The bot can assign/remove roles on interaction.',
    pe_sel_hint_7: 'Users and roles combined.',
    pe_sel_hint_8: 'Shows server channels to select.',
    pe_sel_role_warn: 'The bot needs code to assign/remove roles on interaction.',
    pe_sel_custom_id: 'Custom ID', pe_sel_placeholder: 'Placeholder',
    pe_sel_min: 'Min.', pe_sel_max: 'Max.',
    pe_opts_title: 'Options ({0}/25)', pe_opts_add: '+ Add',
    pe_opt_n: 'Option {0}', pe_opt_label: 'Label', pe_opt_value: 'Value',
    pe_opt_warn: '⚠ Needs at least 1 option to be sent.',
    pe_row_conflict: '⚠ Cannot have buttons and a select menu at the same time. Remove one type.',
    pe_row_hint: 'Use the "+" in the tree to add buttons or select menus.',
    pe_row_rule: 'Rule: max. 5 buttons OR 1 select menu per Action Row.',
    pe_accent_color: 'Accent color', pe_no_color: 'No color',
    pe_spoiler: 'Spoiler', pe_cont_sel_placeholder_rol: 'Select role…',
    pe_cont_sel_placeholder_user: 'Select user…',

    eb_title: 'Embed Builder', eb_back: '← V2',
    eb_sending: 'Sending…', eb_send: 'Send', eb_export: 'Export',
    eb_ready: 'Ready',

    eb_username: 'Username override', eb_avatar: 'Avatar override (URL)',
    eb_msg_id_hint: 'empty = new message',

    eb_message: 'Message {0}',
    eb_add_message: 'Add message ({0}/10)',
    eb_content: 'Message content',
    eb_content_ph: 'Text above the embed — @mentions, **bold**, :emojis:…',
    eb_add_embed: 'Add embed ({0}/10)',
    eb_no_title: 'No title',
    eb_color: 'Accent color',
    eb_no_color: '∅ No color',
    eb_author: 'Author', eb_author_name: 'Name',
    eb_author_url: 'Author URL', eb_author_icon: 'Icon URL',
    eb_title_f: 'Title', eb_title_url: 'Title URL',
    eb_title_url_hint: 'https://... (title becomes clickable)',
    eb_description: 'Description',
    eb_desc_ph: 'Markdown, @mentions, :emojis:, links…',
    eb_fields: 'Fields ({0}/25)', eb_field_n: 'FIELD {0}',
    eb_add_field: 'Add field', eb_inline: 'inline',
    eb_field_name_ph: 'Field name',
    eb_field_value_ph: 'Value — supports markdown',
    eb_images: 'Images', eb_image: 'Main image', eb_thumbnail: 'Thumbnail',
    eb_footer: 'Footer', eb_footer_text: 'Footer text',
    eb_footer_icon: 'Icon URL',
    eb_timestamp: 'Include timestamp (current date/time)',
    eb_ansi: 'Color text (ANSI)',
    eb_ansi_tip: 'Use',

    eb_no_content: 'No content to send',
    eb_max_embeds: 'Max 10 embeds', eb_max_msgs: 'Max 10 messages',
    eb_max_fields: 'Max 25 fields',
    eb_only_one_edit: 'Only 1 message when editing. Delete the others or clear the Message ID.',
    eb_sent: 'Sent (ID: {0})', eb_edited_ok: 'Edited (ID: {0})',
    eb_sent_multi: '{0} messages sent', eb_exported: 'JSON exported',
    eb_confirm_embed: 'Delete embed?', eb_confirm_msg: 'Delete message?',
    eb_err_webhook: 'Missing webhook URL',
    eb_err_webhook_invalid: 'Invalid webhook URL',
    eb_err_creds: 'Missing token or Channel ID',

    wm_title: 'Saved webhooks',
    wm_save_current: 'Save current webhook',
    wm_name_placeholder: 'Name (e.g. #general)',
    wm_saved: 'Webhook saved',
    wm_deleted: 'Webhook deleted',
    wm_empty: 'No saved webhooks',
    wm_select_placeholder: 'Load saved webhook…',

    val_total_chars: 'Total text too long: {0} chars (limit {1}). Reduce content.',
    val_empty_text: 'There is an empty Text node — type something or remove it.',
    val_text_too_long: 'Text too long ({0} chars). Discord allows max {1} per node.',
    val_thumb_no_url: 'There is a Thumbnail without URL — add an image URL or remove it.',
    val_gallery_no_url: 'Gallery: item {0} has no image URL.',
    val_row_empty: 'There is an empty Action Row — add at least 1 button or select menu.',
    val_row_conflict: 'An Action Row cannot have buttons AND a select menu at the same time.',
    val_row_one_sel: 'An Action Row can only have 1 select menu.',
    val_row_max_btns: 'An Action Row can have max 5 buttons.',
    val_sel_no_opts: 'Text Select Menu needs at least 1 option (ID: {0}).',
    val_sel_no_id: 'Text Select Menu needs a Custom ID.',
    val_dyn_sel_no_id: 'Select menu needs a Custom ID.',
    val_btn_no_id: 'Button "{0}" needs a Custom ID.',
    val_btn_link_no_url: 'Link button "{0}" needs a URL.',

    eb_sb_msg: '{0} msg', eb_sb_msgs: '{0} msgs',
    eb_sb_embed: '{0} embed', eb_sb_embeds: '{0} embeds',

    copy_link: 'Copy link', copy_link_ok: 'Link copied to clipboard',
    compact_all: 'Collapse all', expand_all: 'Expand all',
    fmt_bold: 'Bold', fmt_italic: 'Italic', fmt_underline: 'Underline',
    fmt_strike: 'Strikethrough', fmt_code: 'Inline code', fmt_codeblock: 'Code block',
    fmt_spoiler: 'Spoiler', fmt_quote: 'Quote',
    hist_title: 'Send History', hist_empty: 'No recent sends',
    hist_clear: 'Clear history', hist_copy_id: 'Copy ID',
    hist_id_copied: 'ID copied', hist_load: 'Load as Message ID',
    tmpl_title: 'Templates', tmpl_save: 'Save as template',
    tmpl_name_ph: 'Template name…', tmpl_saved: 'Template saved',
    tmpl_loaded: 'Template loaded', tmpl_deleted: 'Template deleted',
    tmpl_empty: 'No saved templates',
    tmpl_confirm_load: 'Load template? Current content will be replaced.',
    tmpl_confirm_delete: 'Delete this template?',
    import_title: 'Import from Discord',
    import_json_ph: 'Paste the message JSON here…',
    import_btn: 'Import', import_ok: 'Imported successfully',
    import_err: 'Invalid JSON or unrecognized format',
    import_hint: 'Paste a Discord message JSON payload. Supports embeds, content, username/avatar.',
    eb_link_btns: 'Link buttons ({0}/{1})',
    eb_add_row: '+ Button row',
    eb_add_link_btn: '+ Button',
    eb_btn_label_ph: 'Button text',
    eb_btn_url_ph: 'https://...',
    eb_btn_row_n: 'Row {0}',
    eb_btn_n: 'Button {0}',
    eb_btn_emoji_ph: 'emoji (optional)',
    eb_max_rows: 'Max 5 button rows',
    eb_max_btns_row: 'Max 5 buttons per row',
    diff_title: 'Changes detected', diff_no_changes: 'No changes from original',
    theme_light: 'Light mode', theme_dark: 'Dark mode',
    export_png: 'Export PNG',
    wh_appearance_title: 'Webhook Appearance',
    wh_appearance_sub: 'Configure how the bot looks in the preview and the sent message.',
    wh_appearance_preview_msg: 'This is a sample message.',
    wh_appearance_loading: 'Fetching webhook info…',
    wh_appearance_real: 'real webhook bot',
    wh_appearance_use_real: 'Use real',
    wh_appearance_no_url: 'Enter a valid webhook URL to fetch the bot info.',
    wh_appearance_save: 'Save',
    wh_appearance_btn: 'Appearance',
    picker_mentions: 'Mentions', picker_time: 'Time', picker_emojis: 'Emojis',
    picker_add: 'Add channel or role', picker_name_ph: 'Name (optional)',
    picker_save_mention: 'Save mention',
    picker_date: 'Date', picker_time_label: 'Time',
    picker_emoji_search: 'Search emoji…',
  },
  pt: {
    cancel: 'Cancelar', yes: 'Sim', no: 'Não', none: 'Nenhum',
    optional: 'opcional', edit_hint: 'editar',

    bot_token_mode: 'Bot Token', webhook_mode: 'Webhook',
    bot_token_label: 'Bot Token', channel_id: 'Channel ID',
    webhook_url: 'URL do Webhook',
    webhook_no_preview: 'O preview do bot não aparece no modo webhook.',
    thread_id: 'THREAD ID', message_id: 'MESSAGE ID',
    thread_placeholder: 'ID da thread…', msg_placeholder: 'ID ou URL…',
    reply_to: 'RESPONDER A', reply_placeholder: 'ID da mensagem para responder…',
    restore_btn: '↩ Restaurar', edit_btn: '✏ Editar mensagem',

    embed_normal_btn: 'Embed normal', badge_soon: 'Em breve',
    pings_on: 'Pings ON', pings_off: 'Pings OFF',
    export_btn: 'Exportar', clear_btn: 'Limpar',
    send_btn: 'Enviar', sending_btn: 'Enviando…',
    char_counter_title: 'Texto na Msg {0} (limite Discord: {1} chars)',

    add_to_root: 'Adicionar na raiz',
    toolbar_in_container: 'Adicionar no container',
    toolbar_in_row: 'Adicionar no row',
    comp_text: 'Texto', comp_section: 'Section', comp_gallery: 'Gallery',
    comp_divider: 'Divider', comp_container: 'Container', comp_row: 'Row',
    comp_button: 'Botão', comp_select_text: 'Select texto',
    comp_select_roles: 'Select cargos', comp_select_users: 'Select usuários',
    comp_select_mentions: 'Select menções', comp_select_channels: 'Select canais',

    messages_label: 'Mensagens',
    add_message_btn: 'Nova mensagem',
    panel_tree: 'Árvore · Msg {0}',
    panel_props: 'Propriedades',
    props_empty: 'Selecione um componente para editar suas propriedades.',
    props_editing: 'Editando:',

    row_webhook_warn: 'Action Rows precisam de Bot Token para funcionar. Selects de cargos/usuários/canais/menções não podem ser enviados via webhook.',

    status_ready: 'Pronto',
    status_msg: 'Msg {0}/{1} · {2} comp.',

    security_title: 'Tem certeza?',
    security_label_token: 'Token do Bot do Discord',
    security_label_webhook: 'URL de Webhook do Discord',
    security_desc_token: 'Você está prestes a inserir o token do seu bot. Essa credencial permite controle total do bot. Nunca compartilhe seu token com ninguém.',
    security_desc_webhook: 'Você está prestes a inserir uma URL de webhook. Essa URL permite publicar mensagens no canal vinculado sem autenticação adicional.',
    security_local: 'Suas credenciais são armazenadas localmente no seu navegador (localStorage) e enviadas diretamente ao Discord — nunca a servidores externos. Este app roda localmente.',
    security_confirm: 'Sim, continuar →',

    cs_title: 'Em breve', cs_sub: 'Embeds normais do Discord',
    cs_desc: 'O suporte para embeds normais (tipo 0, com campos, imagem, footer, author…) está em desenvolvimento.',
    cs_tip: 'Por enquanto, use Components V2 (Containers, Seções, Galerias, etc.) que oferecem muito mais controle visual.',
    cs_ok: 'Entendido',

    toast_added: '{0} adicionado',
    toast_removed: 'Componente excluído',
    toast_duplicated: 'Componente duplicado',
    toast_msg_added: 'Nova mensagem adicionada',
    toast_msg_removed: 'Mensagem {0} excluída',
    toast_pings_on: 'Pings ativados', toast_pings_off: 'Pings desativados',
    toast_cleared: 'Componentes removidos', toast_exported: 'JSON exportado',
    toast_restored: 'Mensagem restaurada', toast_edited: 'Mensagem editada',
    toast_sent: 'Mensagem enviada', toast_sent_multi: '{0} mensagens enviadas',
    err_min_msg: 'Deve haver pelo menos uma mensagem',
    err_empty_token: 'Faltando token ou Channel ID',
    err_empty_webhook: 'Faltando URL do webhook',
    err_invalid_webhook: 'URL do webhook inválida',
    err_empty_msg: 'Msg {0} está vazia — adicione componentes ou exclua.',
    err_dynamic_sel: 'Selects de cargos/usuários/canais/menções só funcionam no modo Bot Token.',
    err_no_msg_id: 'Insira um Message ID ou URL',
    err_no_components: 'A mensagem não tem componentes',
    confirm_clear_one: 'Excluir todos os componentes?',
    confirm_clear_msg: 'Excluir todos os componentes da Msg {0}?',
    confirm_del_msg: 'Excluir Mensagem {0}?',

    pe_content: 'Conteúdo',
    pe_spacing: 'Espaçamento', pe_sp_normal: 'Normal (1)', pe_sp_large: 'Grande (2)',
    pe_divider_visible: 'Linha visível',
    pe_image_url: 'URL da imagem', pe_alt: 'Descrição (alt)',
    pe_accessory: 'Acessório', pe_accessory_none: 'Nenhum', pe_accessory_btn: 'Botão',
    pe_accessory_edit: 'Selecione o acessório na árvore para editá-lo.',
    pe_gallery_images: 'Imagens ({0}/10)', pe_gallery_add: '+ Adicionar',
    pe_image_n: 'Imagem {0}', pe_description: 'Descrição',
    pe_btn_label: 'Texto', pe_btn_style: 'Estilo',
    pe_btn_url: 'URL', pe_btn_custom_id: 'Custom ID',
    pe_btn_emoji: 'Emoji (nome)', pe_btn_disabled: 'Desabilitado',
    pe_sel_type: 'Tipo de select',
    pe_sel_hint_3: 'O usuário escolhe de uma lista de opções que você define.',
    pe_sel_hint_5: 'Mostra membros do servidor para selecionar.',
    pe_sel_hint_6: 'Mostra cargos do servidor. O bot pode atribuir/remover cargos na interação.',
    pe_sel_hint_7: 'Usuários e cargos combinados.',
    pe_sel_hint_8: 'Mostra canais do servidor para selecionar.',
    pe_sel_role_warn: 'O bot precisa de código para atribuir/remover cargos na interação.',
    pe_sel_custom_id: 'Custom ID', pe_sel_placeholder: 'Placeholder',
    pe_sel_min: 'Mín.', pe_sel_max: 'Máx.',
    pe_opts_title: 'Opções ({0}/25)', pe_opts_add: '+ Adicionar',
    pe_opt_n: 'Opção {0}', pe_opt_label: 'Label', pe_opt_value: 'Value',
    pe_opt_warn: '⚠ Precisa de pelo menos 1 opção para ser enviado.',
    pe_row_conflict: '⚠ Não pode ter botões e select menu ao mesmo tempo. Remova um dos tipos.',
    pe_row_hint: 'Use o "+" na árvore para adicionar botões ou select menus.',
    pe_row_rule: 'Regra: máx. 5 botões OR 1 select menu por Action Row.',
    pe_accent_color: 'Accent color', pe_no_color: 'Sem cor',
    pe_spoiler: 'Spoiler', pe_cont_sel_placeholder_rol: 'Selecionar cargo…',
    pe_cont_sel_placeholder_user: 'Selecionar usuário…',

    eb_title: 'Embed Builder', eb_back: '← V2',
    eb_sending: 'Enviando…', eb_send: 'Enviar', eb_export: 'Exportar',
    eb_ready: 'Pronto',

    eb_username: 'Override de username', eb_avatar: 'Override de avatar (URL)',
    eb_msg_id_hint: 'vazio = nova mensagem',

    eb_message: 'Mensagem {0}',
    eb_add_message: 'Adicionar mensagem ({0}/10)',
    eb_content: 'Conteúdo da mensagem',
    eb_content_ph: 'Texto acima do embed — @menções, **negrito**, :emojis:…',
    eb_add_embed: 'Adicionar embed ({0}/10)',
    eb_no_title: 'Sem título',
    eb_color: 'Cor de destaque',
    eb_no_color: '∅ Sem cor',
    eb_author: 'Autor', eb_author_name: 'Nome',
    eb_author_url: 'URL do autor', eb_author_icon: 'URL do ícone',
    eb_title_f: 'Título', eb_title_url: 'URL do título',
    eb_title_url_hint: 'https://... (o título se torna clicável)',
    eb_description: 'Descrição',
    eb_desc_ph: 'Markdown, @menções, :emojis:, links…',
    eb_fields: 'Campos ({0}/25)', eb_field_n: 'CAMPO {0}',
    eb_add_field: 'Adicionar campo', eb_inline: 'inline',
    eb_field_name_ph: 'Nome do campo',
    eb_field_value_ph: 'Valor — suporta markdown',
    eb_images: 'Imagens', eb_image: 'Imagem principal', eb_thumbnail: 'Thumbnail',
    eb_footer: 'Footer', eb_footer_text: 'Texto do footer',
    eb_footer_icon: 'URL do ícone',
    eb_timestamp: 'Incluir timestamp (data/hora atual)',
    eb_ansi: 'Texto colorido (ANSI)',
    eb_ansi_tip: 'Use',

    eb_no_content: 'Sem conteúdo para enviar',
    eb_max_embeds: 'Máximo 10 embeds', eb_max_msgs: 'Máximo 10 mensagens',
    eb_max_fields: 'Máximo 25 campos',
    eb_only_one_edit: 'Apenas 1 mensagem ao editar. Exclua as outras ou limpe o Message ID.',
    eb_sent: 'Enviado (ID: {0})', eb_edited_ok: 'Editado (ID: {0})',
    eb_sent_multi: '{0} mensagens enviadas', eb_exported: 'JSON exportado',
    eb_confirm_embed: 'Excluir embed?', eb_confirm_msg: 'Excluir mensagem?',
    eb_err_webhook: 'Faltando URL do webhook',
    eb_err_webhook_invalid: 'URL do webhook inválida',
    eb_err_creds: 'Faltando token ou Channel ID',

    wm_title: 'Webhooks salvos',
    wm_save_current: 'Salvar webhook atual',
    wm_name_placeholder: 'Nome (ex: #geral)',
    wm_saved: 'Webhook salvo',
    wm_deleted: 'Webhook excluído',
    wm_empty: 'Nenhum webhook salvo',
    wm_select_placeholder: 'Carregar webhook salvo…',

    val_total_chars: 'Texto total muito longo: {0} chars (limite {1}). Reduza o conteúdo.',
    val_empty_text: 'Há um nó de Texto vazio — escreva algo ou remova-o.',
    val_text_too_long: 'Texto muito longo ({0} chars). Discord permite máximo {1} por nó.',
    val_thumb_no_url: 'Há um Thumbnail sem URL — adicione uma URL de imagem ou remova-o.',
    val_gallery_no_url: 'Galeria: item {0} não tem URL de imagem.',
    val_row_empty: 'Há um Action Row vazio — adicione pelo menos 1 botão ou select menu.',
    val_row_conflict: 'Um Action Row não pode ter botões E select menu ao mesmo tempo.',
    val_row_one_sel: 'Um Action Row só pode ter 1 select menu.',
    val_row_max_btns: 'Um Action Row pode ter no máximo 5 botões.',
    val_sel_no_opts: 'Select Menu de texto precisa de pelo menos 1 opção (ID: {0}).',
    val_sel_no_id: 'Select Menu de texto precisa de um Custom ID.',
    val_dyn_sel_no_id: 'Select menu precisa de um Custom ID.',
    val_btn_no_id: 'Botão "{0}" precisa de um Custom ID.',
    val_btn_link_no_url: 'Botão link "{0}" precisa de uma URL.',

    eb_sb_msg: '{0} msg', eb_sb_msgs: '{0} msgs',
    eb_sb_embed: '{0} embed', eb_sb_embeds: '{0} embeds',

    copy_link: 'Copiar link', copy_link_ok: 'Link copiado para a área de transferência',
    compact_all: 'Recolher tudo', expand_all: 'Expandir tudo',
    fmt_bold: 'Negrito', fmt_italic: 'Itálico', fmt_underline: 'Sublinhado',
    fmt_strike: 'Tachado', fmt_code: 'Código inline', fmt_codeblock: 'Bloco de código',
    fmt_spoiler: 'Spoiler', fmt_quote: 'Citação',
    hist_title: 'Histórico de envios', hist_empty: 'Nenhum envio recente',
    hist_clear: 'Limpar histórico', hist_copy_id: 'Copiar ID',
    hist_id_copied: 'ID copiado', hist_load: 'Carregar como Message ID',
    tmpl_title: 'Modelos', tmpl_save: 'Salvar como modelo',
    tmpl_name_ph: 'Nome do modelo…', tmpl_saved: 'Modelo salvo',
    tmpl_loaded: 'Modelo carregado', tmpl_deleted: 'Modelo excluído',
    tmpl_empty: 'Nenhum modelo salvo',
    tmpl_confirm_load: 'Carregar modelo? O conteúdo atual será substituído.',
    tmpl_confirm_delete: 'Excluir este modelo?',
    import_title: 'Importar do Discord',
    import_json_ph: 'Cole o JSON da mensagem aqui…',
    import_btn: 'Importar', import_ok: 'Importado com sucesso',
    import_err: 'JSON inválido ou formato não reconhecido',
    import_hint: 'Cole o payload JSON de uma mensagem do Discord. Suporta embeds, content, username/avatar.',
    eb_link_btns: 'Botões de link ({0}/{1})',
    eb_add_row: '+ Linha de botões',
    eb_add_link_btn: '+ Botão',
    eb_btn_label_ph: 'Texto do botão',
    eb_btn_url_ph: 'https://...',
    eb_btn_row_n: 'Linha {0}',
    eb_btn_n: 'Botão {0}',
    eb_btn_emoji_ph: 'emoji (opcional)',
    eb_max_rows: 'Máximo 5 linhas de botões',
    eb_max_btns_row: 'Máximo 5 botões por linha',
    diff_title: 'Alterações detectadas', diff_no_changes: 'Sem alterações em relação ao original',
    theme_light: 'Modo claro', theme_dark: 'Modo escuro',
    export_png: 'Exportar PNG',
    wh_appearance_title: 'Aparência do Webhook',
    wh_appearance_sub: 'Configure como o bot aparece no preview e na mensagem enviada.',
    wh_appearance_preview_msg: 'Esta é uma mensagem de exemplo.',
    wh_appearance_loading: 'Buscando info do webhook…',
    wh_appearance_real: 'bot real do webhook',
    wh_appearance_use_real: 'Usar real',
    wh_appearance_no_url: 'Insira uma URL de webhook válida para obter as informações do bot.',
    wh_appearance_save: 'Salvar',
    wh_appearance_btn: 'Aparência',
    picker_mentions: 'Menções', picker_time: 'Tempo', picker_emojis: 'Emojis',
    picker_add: 'Adicionar canal ou função', picker_name_ph: 'Nome (opcional)',
    picker_save_mention: 'Salvar menção',
    picker_date: 'Data', picker_time_label: 'Hora',
    picker_emoji_search: 'Buscar emoji…',
  },
} as const;

export type TKey = keyof typeof T.es;

// ── Context ───────────────────────────────────────────────────────────────────

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: TKey, ...args: (string | number)[]) => string;
}

const Ctx = createContext<I18nCtx>({
  lang: 'es',
  setLang: () => {},
  t: (key) => T.es[key] as string,
});

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    try { return (localStorage.getItem('dcb_lang') as Lang | null) || 'es'; } catch { return 'es'; }
  });

  const t = (key: TKey, ...args: (string | number)[]): string => {
    let str = (T[lang] as Record<string, string>)[key] ?? (T.es as Record<string, string>)[key] ?? String(key);
    args.forEach((a, i) => { str = str.replace(`{${i}}`, String(a)); });
    return str;
  };

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('dcb_lang', l); } catch {}
  };

  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export const useT = () => useContext(Ctx);

// ── Language switcher component ───────────────────────────────────────────────

const LANG_LABELS: Record<Lang, string> = { es: 'ES', en: 'EN', pt: 'PT' };

export function LangSwitch() {
  const { lang, setLang } = useT();
  return (
    <div style={{ display: 'flex', gap: 1, background: '#1e1f22', borderRadius: 5, padding: 2 }}>
      {LANGS.map(l => (
        <button key={l} onClick={() => setLang(l)} style={{
          background: lang === l ? '#3f4147' : 'transparent',
          border: 'none', borderRadius: 3,
          color: lang === l ? '#dbdee1' : '#5c5f66',
          cursor: 'pointer', fontSize: 11, fontWeight: 700, letterSpacing: '.04em',
          padding: '4px 7px', transition: 'background .12s, color .12s',
        }}>
          {LANG_LABELS[l]}
        </button>
      ))}
    </div>
  );
}
