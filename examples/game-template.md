---
title: "{{title}}"
releaseDate: {{releaseDate}}
coverUrl: "{{coverUrl}}"
localCoverImage: [[{{localCoverImage}}]]
genres:
<%= item.genres?.map(g => '  - ' + g).join('\n') || '' %>
sourceUrl: "{{link}}"
status: Backlog
---
