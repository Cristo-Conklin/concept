import React, { useCallback } from 'react';
import {
  Editable as SlateEditable, useSlate, Editor, useSelected, useFocused
} from 'slate-react';
import isHotkey from 'is-hotkey';
import { makeStyles } from '@material-ui/core/styles';


import { toggleMark } from '../utils/editor';


const useStyles = makeStyles(theme => ({
  image: {
    display: "block",
    maxWidth: "100%",
    maxHeight: theme.spacing(20),
    boxShadow: ({selected, focused}) => selected && focused ? '0 0 0 3px #B4D5FF' : 'none'
  }
}))

const HOTKEYS = {
  'mod+b': 'bold',
  'mod+i': 'italic',
  'mod+u': 'underline',
  'mod+`': 'code',
}

const Leaf = ({ attributes, children, leaf }) => {
  if (leaf.bold) {
    children = <strong>{children}</strong>
  }

  if (leaf.code) {
    children = <code>{children}</code>
  }

  if (leaf.italic) {
    children = <em>{children}</em>
  }

  if (leaf.underline) {
    children = <u>{children}</u>
  }

  return <span {...attributes}>{children}</span>
}

const ImageElement = ({ attributes, children, element }) => {
  const selected = useSelected()
  const focused = useFocused()
  const classes = useStyles({selected, focused})
  return (
    <div {...attributes}>
      <div contentEditable={false}>
        <img
          src={element.url}
          className={classes.image}
        />
      </div>
      {children}
    </div>
  )
}

const Element = ({ attributes, children, element }) => {
  switch (element.type) {
  case 'block-quote':
    return <blockquote {...attributes}>{children}</blockquote>
  case 'bulleted-list':
    return <ul {...attributes}>{children}</ul>
  case 'heading-one':
    return <h1 {...attributes}>{children}</h1>
  case 'heading-two':
    return <h2 {...attributes}>{children}</h2>
  case 'list-item':
    return <li {...attributes}>{children}</li>
  case 'numbered-list':
    return <ol {...attributes}>{children}</ol>
  case 'image':
    return <ImageElement element={element} {...attributes}>{children}</ImageElement>
  case 'link':
    return (
      <a {...attributes} href={element.url}>
        {children}
      </a>
    )
  default:
    return <p {...attributes}>{children}</p>
  }
}

export default function Editable({editor, ...props}){
  const renderLeaf = useCallback(props => <Leaf {...props} />, [])
  const renderElement = useCallback(props => <Element {...props} />, [])
  return <SlateEditable
           renderLeaf={renderLeaf}
           renderElement={renderElement}
           spellCheck
           placeholder="What's your favorite concept..."
           onKeyDown={event => {
             for (const hotkey in HOTKEYS) {
               if (isHotkey(hotkey, event)) {
                 event.preventDefault()
                 const mark = HOTKEYS[hotkey]
                 toggleMark(editor, mark)
               }
             }
           }}
           {...props}/>
}