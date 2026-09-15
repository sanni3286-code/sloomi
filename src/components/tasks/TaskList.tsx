import { DndContext, type DragEndEvent, PointerSensor, useSensor, useSensors, closestCenter } from '@dnd-kit/core';
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TaskRow, type RowStatusVariant } from './TaskRow';
import { SwipeableRow } from './SwipeableRow';
import { formatClock, formatDurationMin } from '../../lib/format';

export interface TaskListItem {
  id: string;
  title: string;
  icon: string;
  color: string;
  durationSeconds: number;
  status: RowStatusVariant;
  expectedTime?: Date;
  draggable: boolean;
}

interface TaskListProps {
  items: TaskListItem[];
  onReorderDraggable: (orderedIds: string[]) => void;
  onTapItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  deleteLabel?: string;
  allowDelete?: (item: TaskListItem) => boolean;
}

function SortableItem({
  item,
  onTapItem,
  onDeleteItem,
  deleteLabel,
  allowDelete,
}: {
  item: TaskListItem;
  onTapItem: (id: string) => void;
  onDeleteItem?: (id: string) => void;
  deleteLabel: string;
  allowDelete: boolean;
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  const row = (
    <TaskRow
      title={item.title}
      icon={item.icon}
      color={item.color}
      durationLabel={formatDurationMin(item.durationSeconds)}
      timeLabel={item.expectedTime ? formatClock(item.expectedTime) : undefined}
      status={item.status}
      onTap={() => onTapItem(item.id)}
      dragHandleRef={setActivatorNodeRef}
      dragHandleListeners={{ ...attributes, ...listeners }}
    />
  );

  return (
    <div ref={setNodeRef} style={style}>
      {onDeleteItem && allowDelete ? (
        <SwipeableRow onAction={() => onDeleteItem(item.id)} actionLabel={deleteLabel}>
          {row}
        </SwipeableRow>
      ) : (
        row
      )}
    </div>
  );
}

export function TaskList({ items, onReorderDraggable, onTapItem, onDeleteItem, deleteLabel = 'Löschen', allowDelete }: TaskListProps) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
  );

  const locked = items.filter((i) => !i.draggable);
  const draggableItems = items.filter((i) => i.draggable);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = draggableItems.findIndex((i) => i.id === active.id);
    const newIndex = draggableItems.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const reordered = arrayMove(draggableItems, oldIndex, newIndex);
    onReorderDraggable(reordered.map((i) => i.id));
  }

  return (
    <div className="flex flex-col gap-2">
      {locked.map((item) => (
        <div key={item.id}>
          {onDeleteItem && (allowDelete?.(item) ?? false) ? (
            <SwipeableRow onAction={() => onDeleteItem(item.id)} actionLabel={deleteLabel}>
              <TaskRow
                title={item.title}
                icon={item.icon}
                color={item.color}
                durationLabel={formatDurationMin(item.durationSeconds)}
                timeLabel={item.expectedTime ? formatClock(item.expectedTime) : undefined}
                status={item.status}
                onTap={() => onTapItem(item.id)}
              />
            </SwipeableRow>
          ) : (
            <TaskRow
              title={item.title}
              icon={item.icon}
              color={item.color}
              durationLabel={formatDurationMin(item.durationSeconds)}
              timeLabel={item.expectedTime ? formatClock(item.expectedTime) : undefined}
              status={item.status}
              onTap={() => onTapItem(item.id)}
            />
          )}
        </div>
      ))}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={draggableItems.map((i) => i.id)} strategy={verticalListSortingStrategy}>
          {draggableItems.map((item) => (
            <SortableItem
              key={item.id}
              item={item}
              onTapItem={onTapItem}
              onDeleteItem={onDeleteItem}
              deleteLabel={deleteLabel}
              allowDelete={allowDelete?.(item) ?? true}
            />
          ))}
        </SortableContext>
      </DndContext>
    </div>
  );
}
