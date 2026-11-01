// The "Request a generator" dialog can be opened from the directory's request
// card, including when its search finds nothing; the layout shows it. `topic` is what the teacher was looking for.

export const request = $state({ open: false, topic: '' })

export function openRequest(topic = '') {
  request.topic = topic.trim()
  request.open = true
}
