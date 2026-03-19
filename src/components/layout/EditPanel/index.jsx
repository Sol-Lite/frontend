import { useState } from 'react'
import WidgetTypeList from './WidgetTypeList'
import WidgetSizeList from './WidgetSizeList'

export default function EditPanel() {
  const [selectedType, setSelectedType] = useState(null)

  return (
    <aside className="w-chat-panel flex flex-col bg-surface border-l border-stroke shrink-0 overflow-hidden">
      {selectedType ? (
        <WidgetSizeList
          widgetType={selectedType}
          onBack={() => setSelectedType(null)}
        />
      ) : (
        <WidgetTypeList onSelectType={setSelectedType} />
      )}
    </aside>
  )
}
