import React, { useState, useEffect } from "react";
import axios from "axios";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import "./App.css";

const mockMembers = [
  { id: "u-1", name: "You", initial: "Y" },
  { id: "u-2", name: "Alice", initial: "A" },
];
const mockLabels = [
  { id: "l-blue", color: "#00C6FF", name: "Feature" },
  { id: "l-red", color: "#ef4444", name: "Bug" },
  { id: "l-green", color: "#10b981", name: "Done" },
];

const fallbackBoards = [
  {
    id: "b-1",
    title: "Bhawika's Productivity Board",
    background: "linear-gradient(135deg, #026bb9, #004d8f)",
    lists: [
      { id: "l-1", title: "To Do", cards: [{ id: "c-1", title: "Complete Trello Clone Project" }, { id: "c-2", title: "Prepare for Placement Interviews" }, { id: "c-3", title: "Revise DSA Questions" }] },
      { id: "l-2", title: "In Progress", cards: [{ id: "c-4", title: "Work on Backend Integration" }, { id: "c-5", title: "Improve UI Design" }] }
    ]
  },
  {
    id: "b-2",
    title: "Bhawika's Daily Stuffs",
    background: "linear-gradient(135deg, #026bb9, #004d8f)",
    lists: [
      { id: "l-3", title: "Personal Tasks", cards: [{ id: "c-6", title: "Sleep 6 hours" }, { id: "c-7", title: "Hit the Gym" }, { id: "c-8", title: "Diet Plan" }] }
    ]
  }
];

function App() {
  const [data, setData] = useState({ boards: [], activeBoardId: null });
  const [loading, setLoading] = useState(true);

  // Search and Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [filterLabel, setFilterLabel] = useState("");
  const [filterMember, setFilterMember] = useState("");
  const [filterDueDate, setFilterDueDate] = useState("");

  const [selectedCardInfo, setSelectedCardInfo] = useState(null); 
  const [showBoardSwitcher, setShowBoardSwitcher] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);

  // 1. FETCH DATA & HYBRID MERGE
  const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000";

  useEffect(() => {
    axios.get(`${API_BASE}/boards`).then((res) => {
      let rawBoards = [];
      
      if (res.data.status === "UNINITIALIZED") {
         console.warn("DB is empty. Using fallback boards for demo.");
         rawBoards = fallbackBoards;
      } else if (res.data.status === "ERROR") {
         console.error("DB connection error. Using fallback boards.");
         rawBoards = fallbackBoards;
      } else {
         rawBoards = res.data;
      }

      const bonusCache = JSON.parse(localStorage.getItem('taskverse-bonus-cache')) || {};
      
      const defaultCovers = {
          'c-1': 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&w=400&q=80',
          'c-2': 'https://images.unsplash.com/photo-1573164713988-8665fc963095?auto=format&fit=crop&w=400&q=80',
          'c-3': 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?auto=format&fit=crop&w=400&q=80',
          'c-4': 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=400&q=80',
          'c-5': 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=400&q=80', 
          'c-6': '/sleep_cover.png',
          'c-7': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=400&q=80',
          'c-8': '/diet_cover.png'
      };

      const augmentedBoards = rawBoards.map((board) => {
          const boardBonus = bonusCache[board.id] || { background: board.background || "linear-gradient(135deg, #026bb9, #004d8f)" };
          return {
              ...board,
              background: boardBonus.background,
              lists: (board.lists || []).map(list => ({
                  ...list,
                  cards: (list.cards || []).map(card => {
                      const cardBonus = bonusCache[card.id] || {};
                      return {
                          ...card,
                          description: cardBonus.description || card.description || "",
                          comments: cardBonus.comments || [],
                          attachments: cardBonus.attachments || [],
                          checklists: cardBonus.checklists || [],
                          cover: cardBonus.cover || defaultCovers[card.id] || "",
                          labels: cardBonus.labels || [],
                          members: cardBonus.members || [],
                          dueDate: cardBonus.dueDate || ""
                      };
                  })
              }))
          };
      });

      setData({
        boards: augmentedBoards,
        activeBoardId: augmentedBoards[0]?.id || null,
      });
      setLoading(false);
    }).catch(err => {
        console.error("Backend unreachable. Using fallback.", err);
        setData({ boards: fallbackBoards, activeBoardId: fallbackBoards[0].id });
        setLoading(false);
    });
  }, []);

  // 2. HYBRID PERSIST (Save Premium Features Locally side-by-side with SQL)
  useEffect(() => {
      if (data.boards.length === 0) return;
      const bonusCache = JSON.parse(localStorage.getItem('taskverse-bonus-cache')) || {};
      data.boards.forEach(board => {
          bonusCache[board.id] = { background: board.background };
          board.lists.forEach(list => {
              list.cards.forEach(card => {
                  bonusCache[card.id] = {
                      description: card.description,
                      comments: card.comments,
                      attachments: card.attachments,
                      checklists: card.checklists,
                      cover: card.cover,
                      labels: card.labels,
                      members: card.members,
                      dueDate: card.dueDate
                  };
              });
          });
      });
      localStorage.setItem('taskverse-bonus-cache', JSON.stringify(bonusCache));
  }, [data]);

  const activeBoard = data.boards.find(b => b.id === data.activeBoardId) || data.boards[0];
  const lists = activeBoard?.lists || [];

  const updateActiveBoardLists = (newLists) => {
      const newBoards = data.boards.map(b => b.id === activeBoard.id ? { ...b, lists: newLists } : b);
      setData({ ...data, boards: newBoards });
  };

  const setBoardTitle = (newTitle) => {
      const newBoards = data.boards.map(b => b.id === activeBoard.id ? { ...b, title: newTitle } : b);
      setData({ ...data, boards: newBoards });
  };
  
  const changeBackground = (bg) => {
      if(!bg) return;
      const newBoards = data.boards.map(b => b.id === activeBoard.id ? { ...b, background: bg } : b);
      setData({ ...data, boards: newBoards });
      setShowBgPicker(false);
  };

  // DRAG AND DROP (Immuto-Clone mapping)
  const onDragEnd = (result) => {
    if (searchQuery || filterLabel || filterMember || filterDueDate) {
       alert("Drag and drop sorting is disabled while searching or filtering cards.");
       return;
    }
    const { source, destination, type } = result;
    if (!destination) return;

    if (type === "list") {
      const newLists = [...lists];
      const [moved] = newLists.splice(source.index, 1);
      newLists.splice(destination.index, 0, moved);
      updateActiveBoardLists(newLists);
      return;
    }

    const newLists = lists.map(l => ({ ...l, cards: [...l.cards] })); 
    const sourceListIndex = newLists.findIndex(l => l.id === source.droppableId);
    const destListIndex = newLists.findIndex(l => l.id === destination.droppableId);

    const [movedCard] = newLists[sourceListIndex].cards.splice(source.index, 1);
    newLists[destListIndex].cards.splice(destination.index, 0, movedCard);

    updateActiveBoardLists(newLists);
  };

  const addList = () => {
    const title = prompt("Enter list title:");
    if (!title) return;
    updateActiveBoardLists([...lists, { id: `list-${Date.now()}`, title, cards: [] }]);
  };
  const editListTitle = (index) => {
    const newTitle = prompt("Edit list title:", lists[index].title);
    if (!newTitle) return;
    const newLists = lists.map((l, i) => i === index ? { ...l, title: newTitle } : l);
    updateActiveBoardLists(newLists);
  };
  const deleteList = (index) => {
    if (!confirm("Delete this list?")) return;
    const newLists = lists.filter((_, i) => i !== index);
    updateActiveBoardLists(newLists);
  };

  // HYBRID CARD ADD (Sends to MySQL via Axios, augments local UI)
  const addCard = async (listIndex) => {
    const text = prompt("Enter card title:");
    if (!text) return;
    const targetList = lists[listIndex];

    try {
        const res = await axios.post(`${API_BASE}/cards`, { title: text, listId: targetList.id });
        const newCard = res.data;
        
        const augmentedCard = {
            ...newCard,
            id: newCard.id, // from db
            title: newCard.title, 
            description: "", comments: [], attachments: [], checklists: [], cover: "", labels: [], members: [], dueDate: ""
        };

        const newLists = lists.map((l, i) => {
            if (i === listIndex) {
                return { ...l, cards: [...l.cards, augmentedCard] };
            }
            return l;
        });
        updateActiveBoardLists(newLists);
    } catch (err) { 
        alert("Failed to save full card to MySQL database. Server might be down."); 
    }
  };

  const deleteCard = (listId, cardId) => {
    if (!confirm("Delete this card permanently?")) return;
    const newLists = lists.map(l => {
        if (l.id === listId) {
            return { ...l, cards: l.cards.filter(c => c.id !== cardId) };
        }
        return l;
    });
    updateActiveBoardLists(newLists);
    setSelectedCardInfo(null);
  };

  const getVisibleCards = (cards) => {
     return cards.filter(c => {
         const matchSearch = (c.title || "").toLowerCase().includes(searchQuery.toLowerCase());
         const matchLabel = filterLabel ? (c.labels && c.labels.includes(filterLabel)) : true;
         const matchMember = filterMember ? (c.members && c.members.includes(filterMember)) : true;
         const matchDueDate = filterDueDate ? c.dueDate === filterDueDate : true;
         return matchSearch && matchLabel && matchMember && matchDueDate;
     });
  };

  const updateCardDetails = (updatedCard) => {
     const newLists = lists.map(l => {
         if (l.id === selectedCardInfo.listId) {
             return {
                 ...l,
                 cards: l.cards.map(c => c.id === selectedCardInfo.cardId ? updatedCard : c)
             };
         }
         return l;
     });
     updateActiveBoardLists(newLists);
     setSelectedCardInfo({ ...selectedCardInfo, card: updatedCard });
  };
  
  const handleSeed = async () => {
    if (!confirm("This will initialize your cloud database with demo data. Continue?")) return;
    setLoading(true);
    try {
        await axios.post(`${API_BASE}/seed`);
        window.location.reload();
    } catch (err) {
        alert("Seeding failed. Make sure your backend is running and DB credentials are correct.");
        setLoading(false);
    }
  };

  const createFirstBoard = async () => {
     const title = prompt("Enter first board title:");
     if (!title) return;
     // Locally add for now, or you can implement a POST /boards if you want
     const newBoard = { id: `b-${Date.now()}`, title, lists: [], background: "linear-gradient(135deg, #026bb9, #004d8f)" };
     setData({ boards: [newBoard], activeBoardId: newBoard.id });
  };

  if (loading) return <div style={{width:'100vw',height:'100vh',background:'#004d8f',color:'white',display:'flex',justifyContent:'center',alignItems:'center',fontFamily:'Inter'}}><h2>Loading Taskverse...</h2></div>;

  if (data.boards.length === 0) {
      return (
          <div style={{width:'100vw',height:'100vh',background:'#004d8f',color:'white',display:'flex',flexDirection:'column',justifyContent:'center',alignItems:'center',fontFamily:'Inter', textAlign:'center', padding: '20px'}}>
             <h1 style={{fontSize: '48px', marginBottom: '10px'}}>Welcome to Taskverse 🌌</h1>
             <p style={{fontSize: '18px', opacity: 0.8, maxWidth: '600px', marginBottom: '30px'}}>
                It looks like your database is empty. You can start fresh by creating a board, or automatically seed the database with demo tasks.
             </p>
             <div style={{display:'flex', gap: '20px'}}>
                <button 
                   onClick={createFirstBoard}
                   style={{padding: '12px 30px', borderRadius: '30px', border: 'none', background: 'white', color: '#004d8f', fontWeight: 700, cursor:'pointer', fontSize: '16px'}}
                >
                   + Create My First Board
                </button>
                <button 
                   onClick={handleSeed}
                   style={{padding: '12px 30px', borderRadius: '30px', border: '2px solid white', background: 'transparent', color: 'white', fontWeight: 700, cursor:'pointer', fontSize: '16px'}}
                >
                   🚀 Seed Demo Data
                </button>
             </div>
             <p style={{marginTop: '40px', fontSize: '12px', opacity: 0.5}}>
                Using Cloud Database? Make sure your Vercel Environment Variables are set.
             </p>
          </div>
      );
  }

  return (
    <div className="app-container" style={{ background: activeBoard.background }}>
      {/* 1. TOP NAVBAR */}
      <header className="top-navbar">
        <div className="nav-left">
          <div className="logo-container" style={{
              display: 'flex', 
              alignItems: 'center', 
              gap: '10px', 
              background: 'linear-gradient(135deg, rgba(255,255,255,0.2), rgba(255,255,255,0.05))', 
              padding: '6px 20px', 
              borderRadius: '30px', 
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.18)'
          }}>
            <img src="/logo.png" alt="Taskverse Logo" style={{width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover', filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.4))', border: '1px solid rgba(255,255,255,0.2)'}} />
            <span style={{
                fontFamily: 'Inter, sans-serif', 
                fontWeight: 900, 
                fontSize: '22px', 
                letterSpacing: '-0.8px',
                background: 'linear-gradient(90deg, #00C9FF 0%, #92FE9D 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: '1.2'
            }}>Taskverse</span>
          </div>

          <div className="board-switcher">
             <button className="board-switcher-btn" onClick={() => setShowBoardSwitcher(!showBoardSwitcher)}>
                {activeBoard.title}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{marginLeft: 4, verticalAlign:'middle'}}><polyline points="6 9 12 15 18 9"></polyline></svg>
             </button>
             {showBoardSwitcher && (
                <div className="board-dropdown">
                   <div style={{padding: '8px 16px', fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', textTransform:'uppercase'}}>Your SQL Boards</div>
                   {data.boards.map(b => (
                      <div 
                         key={b.id} 
                         className={`board-dropdown-item ${b.id === activeBoard.id ? 'active' : ''}`}
                         onClick={() => { setData({ ...data, activeBoardId: b.id }); setShowBoardSwitcher(false); }}
                      >
                         {b.title}
                      </div>
                   ))}
                </div>
             )}
          </div>
        </div>

        <div className="search-input-container">
          <span style={{fontSize:14, opacity: 0.7}}>🔍</span>
          <input 
             placeholder="Search cards..." 
             value={searchQuery}
             onChange={e => setSearchQuery(e.target.value)}
          />
        </div>
      </header>

      {/* 2. SUB-HEADER WITH FILTERS */}
      <div className="board-header">
         <div style={{display:'flex', alignItems:'center', gap: '8px'}}>
             <span style={{fontSize: '22px'}}>🌌</span>
             <h1 
                className="board-title"
                style={{cursor:'pointer'}}
                onClick={() => { const t = prompt("Board title:", activeBoard.title); if (t) setBoardTitle(t); }}
                title="Click to edit board title"
             >
                 {activeBoard.title}
             </h1>
             <div style={{position:'relative'}}>
                 <button className="modal-btn" style={{background:'rgba(255,255,255,0.2)', color:'white', marginLeft: 12}} onClick={() => setShowBgPicker(!showBgPicker)}>
                    🎨 Change Background
                 </button>
                 {showBgPicker && (
                     <div className="board-dropdown" style={{right:-60, left:'auto', padding:'12px', width:'220px', display:'flex', flexWrap:'wrap', gap:'8px', marginTop: 8}}>
                         <div style={{width:'100%', fontSize:12, fontWeight:700, color:'var(--text-muted)', textTransform:'uppercase', marginBottom:4}}>Presets</div>
                         {[
                            "linear-gradient(135deg, #026bb9, #004d8f)", 
                            "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)", 
                            "linear-gradient(135deg, #11998e, #38ef7d)", 
                            "linear-gradient(135deg, #FF416C, #FF4B2B)", 
                            "linear-gradient(135deg, #232526, #414345)", 
                            "url(https://images.unsplash.com/photo-1542204165-65bf26472b9b?auto=format&fit=crop&w=1920&q=80)"
                         ].map((bg, idx) => (
                             <div 
                                key={idx} 
                                style={{width:'60px', height:'40px', background: bg, backgroundSize:'cover', backgroundPosition:'center', borderRadius:4, cursor:'pointer', border: activeBoard.background === bg ? '2px solid #0052cc' : '1px solid rgba(9,30,66,0.1)'}}
                                onClick={() => changeBackground(bg)}
                             />
                         ))}
                     </div>
                 )}
             </div>
         </div>
         
         <div className="filters-container" style={{display:'flex', gap: '8px', alignItems:'center'}}>
            <span style={{fontSize: 14, opacity: 0.8, marginRight: 4}}>Filters:</span>
            <select 
                value={filterLabel} 
                onChange={e => setFilterLabel(e.target.value)}
                style={{background: 'rgba(255,255,255,0.2)', color:'white', border:'none', borderRadius:4, padding:'6px 8px'}}
            >
               <option value="" style={{color:'black'}}>All Labels</option>
               {mockLabels.map(l => <option key={l.id} value={l.id} style={{color:'black'}}>{l.name}</option>)}
            </select>
            <select 
                value={filterMember} 
                onChange={e => setFilterMember(e.target.value)}
                style={{background: 'rgba(255,255,255,0.2)', color:'white', border:'none', borderRadius:4, padding:'6px 8px'}}
            >
               <option value="" style={{color:'black'}}>All Members</option>
               {mockMembers.map(m => <option key={m.id} value={m.id} style={{color:'black'}}>{m.name}</option>)}
            </select>
         </div>
      </div>

      {/* 3. MAIN BOARD CANVAS */}
      <div className="board-canvas">
         <DragDropContext onDragEnd={onDragEnd}>
           <Droppable droppableId="board" type="list" direction="horizontal">
              {(provided) => (
                 <div className="lists-container" ref={provided.innerRef} {...provided.droppableProps}>
                     {lists.map((list, listIndex) => (
                        <Draggable key={list.id} draggableId={list.id} index={listIndex}>
                           {(provided) => (
                              <div className="list-wrapper" ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                 <div className="list-content">
                                    <div className="list-header">
                                       <span onClick={() => editListTitle(listIndex)} title="Click to edit title">{list.title}</span>
                                       <div className="list-header-icons" onClick={() => deleteList(listIndex)} title="Delete list">...</div>
                                    </div>

                                    <Droppable droppableId={list.id} type="card">
                                       {(provided) => (
                                          <div className="cards-container" ref={provided.innerRef} {...provided.droppableProps}>
                                             {getVisibleCards(list.cards).map((card, index) => (
                                                <Draggable key={card.id || card.title} draggableId={card.id || card.title} index={index}>
                                                   {(provided) => (
                                                      <div 
                                                         className="task-card"
                                                         ref={provided.innerRef}
                                                         {...provided.draggableProps}
                                                         {...provided.dragHandleProps}
                                                         onClick={() => setSelectedCardInfo({ listId: list.id, cardId: card.id, card })}
                                                         style={{
                                                             ...provided.draggableProps.style,
                                                             padding: card.cover ? '0 0 10px 0' : '10px 12px',
                                                             overflow: 'hidden'
                                                         }}
                                                      >
                                                          {/* CARD COVER IMAGE DISPLAY */}
                                                          {card.cover && (
                                                             <div style={{width:'100%', height:'120px', backgroundImage: `url(${card.cover})`, backgroundSize:'cover', backgroundPosition:'center', marginBottom: '8px'}} />
                                                          )}

                                                          <div style={{padding: card.cover ? '0 12px' : 0}}>
                                                              {card.labels && card.labels.length > 0 && (
                                                                 <div style={{display:'flex', gap:4, marginBottom: 4}}>
                                                                    {card.labels.map(lid => {
                                                                        const label = mockLabels.find(l => l.id === lid);
                                                                        return label ? <div key={lid} className="card-color-bar" style={{backgroundColor: label.color}}></div> : null;
                                                                    })}
                                                                 </div>
                                                              )}
                                                              
                                                              <div style={{color:'var(--text-main)'}}>
                                                                  {card.title}
                                                              </div>
                                                              
                                                              {/* Small preview block */}
                                                              {((card.dueDate) || (card.checklists && card.checklists.length > 0) || (card.members && card.members.length > 0) || (card.attachments && card.attachments.length > 0) || (card.comments && card.comments.length > 0)) && (
                                                                 <div style={{display:'flex', gap:10, fontSize:12, color:'var(--text-muted)', alignItems:'center', marginTop: 8, flexWrap:'wrap'}}>
                                                                    {card.dueDate && <span title="Due Date">🕰️ {card.dueDate}</span>}
                                                                    {card.checklists && card.checklists.length > 0 && (
                                                                       <span title="Checklist Items">☑️ {card.checklists.reduce((acc, c) => acc + c.items.filter(i => i.isComplete).length, 0)}/{card.checklists.reduce((acc, c) => acc + c.items.length, 0)}</span>
                                                                    )}
                                                                    {card.attachments && card.attachments.length > 0 && (
                                                                       <span title="Attachments">📎 {card.attachments.length}</span>
                                                                    )}
                                                                    {card.comments && card.comments.length > 0 && (
                                                                       <span title="Comments">💬 {card.comments.length}</span>
                                                                    )}
                                                                    {card.members && card.members.length > 0 && (
                                                                       <div style={{display:'flex', gap:4, marginLeft:'auto'}}>
                                                                           {card.members.map(mid => {
                                                                               const m = mockMembers.find(mem => mem.id === mid);
                                                                               return m ? <div key={mid} style={{width:20, height:20, borderRadius:'50%', background:'#dfe1e6', color:'#172b4d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:'600'}}>{m.initial}</div> : null;
                                                                           })}
                                                                       </div>
                                                                    )}
                                                                 </div>
                                                              )}
                                                          </div>
                                                      </div>
                                                   )}
                                                </Draggable>
                                             ))}
                                             {provided.placeholder}
                                          </div>
                                       )}
                                    </Droppable>

                                    <button className="add-card-basic" onClick={() => addCard(listIndex)}>
                                       <span style={{fontSize: 16}}>+</span> Add a card
                                    </button>
                                 </div>
                              </div>
                           )}
                        </Draggable>
                     ))}
                     {provided.placeholder}

                     <button className="add-list-btn" onClick={addList}>
                        <span style={{fontSize: 16}}>+</span> Add another list
                     </button>
                 </div>
              )}
           </Droppable>
         </DragDropContext>
      </div>

      {/* 4. MODAL DETAILED UI */}
      {selectedCardInfo && (
         <div className="modal-overlay" onMouseDown={() => setSelectedCardInfo(null)}>
            <div className="modal-window" onMouseDown={e => e.stopPropagation()}>
               <button className="close-btn" onClick={() => setSelectedCardInfo(null)}>×</button>

               <div className="modal-content-split" style={{display:'flex', gap: 24}}>
                   <div style={{flex: 1}}>
                      {selectedCardInfo.card.cover && (
                          <div style={{width:'100%', height:'160px', borderRadius:'8px', backgroundImage:`url(${selectedCardInfo.card.cover})`, backgroundSize:'cover', backgroundPosition:'center', marginBottom:24}} />
                      )}

                      <div style={{display:'flex', alignItems:'center', gap: 12, marginBottom:24}}>
                          <span style={{fontSize: 24, alignSelf:'flex-start'}}>🪟</span>
                          <h2 style={{margin:0, fontSize:22, color:'var(--text-main)'}}>{selectedCardInfo.card.title}</h2>
                      </div>
                      
                      <div style={{marginBottom: 24}}>
                         <label className="modal-label">Title</label>
                         <input 
                            className="modal-input"
                            value={selectedCardInfo.card.title}
                            onChange={(e) => updateCardDetails({ ...selectedCardInfo.card, title: e.target.value })}
                         />
                      </div>

                      <div style={{marginBottom: 24}}>
                         <label className="modal-label">Description</label>
                         <textarea 
                            className="modal-input"
                            style={{minHeight:80, padding: '12px', resize:'vertical'}}
                            placeholder="Add more detailed description..."
                            value={selectedCardInfo.card.description || ""}
                            onChange={(e) => updateCardDetails({ ...selectedCardInfo.card, description: e.target.value })}
                         />
                      </div>

                      <div style={{marginBottom: 24}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                              <label className="modal-label" style={{margin:0}}>Attachments</label>
                              <button className="modal-btn" onClick={() => {
                                  const url = prompt("Enter Attachment URL (image, docs, links):");
                                  if (!url) return;
                                  const atts = [...(selectedCardInfo.card.attachments || [])];
                                  atts.push({ id: `att-${Date.now()}`, url, name: url.split('/').pop() || url });
                                  updateCardDetails({ ...selectedCardInfo.card, attachments: atts });
                              }}>Add Attachment</button>
                          </div>
                          <div style={{display:'flex', flexDirection:'column', gap:8}}>
                             {selectedCardInfo.card.attachments?.map((att, idx) => (
                                <div key={att.id} style={{display:'flex', alignItems:'center', justifyContent:'space-between', background:'rgba(9,30,66,0.04)', padding:'8px 12px', borderRadius:4}}>
                                   <a href={att.url} target="_blank" rel="noreferrer" style={{color:'#0052cc', fontWeight:500, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'80%'}}>📎 {att.name}</a>
                                   <button onClick={() => {
                                      const atts = [...selectedCardInfo.card.attachments];
                                      atts.splice(idx, 1);
                                      updateCardDetails({ ...selectedCardInfo.card, attachments: atts });
                                   }} style={{background:'none', border:'none', cursor:'pointer', color:'var(--text-muted)'}}>🗑</button>
                                </div>
                             ))}
                          </div>
                      </div>

                      <div style={{marginBottom: 24}}>
                          <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12}}>
                              <label className="modal-label" style={{margin:0}}>Checklists</label>
                              <button className="modal-btn" onClick={() => {
                                  const t = prompt("Checklist Title:");
                                  if (!t) return;
                                  const chk = [...(selectedCardInfo.card.checklists || []), { id: `chk-${Date.now()}`, title: t, items: [] }];
                                  updateCardDetails({ ...selectedCardInfo.card, checklists: chk });
                              }}>Add Checklist</button>
                          </div>

                          {selectedCardInfo.card.checklists?.map((chk, chkIdx) => (
                              <div key={chk.id} style={{background: 'rgba(9, 30, 66, 0.04)', padding: '16px', borderRadius: '4px', marginBottom: '16px'}}>
                                 <div style={{fontWeight:600, display:'flex', justifyContent:'space-between', marginBottom: 12}}>
                                     {chk.title}
                                     <button onClick={() => {
                                          const newChks = [...selectedCardInfo.card.checklists];
                                          newChks.splice(chkIdx, 1);
                                          updateCardDetails({ ...selectedCardInfo.card, checklists: newChks });
                                     }} className="modal-btn" style={{padding: '4px 8px'}}>Delete</button>
                                 </div>
                                 
                                 <div style={{marginBottom: 12}}>
                                    {chk.items.map((item, itemIdx) => (
                                       <label key={item.id} style={{display:'flex', gap:'8px', alignItems:'center', marginBottom:'8px'}}>
                                          <input 
                                             type="checkbox" 
                                             checked={item.isComplete}
                                             style={{width: '16px', height: '16px', cursor:'pointer'}}
                                             onChange={(e) => {
                                                 const newChks = [...selectedCardInfo.card.checklists];
                                                 newChks[chkIdx].items[itemIdx].isComplete = e.target.checked;
                                                 updateCardDetails({ ...selectedCardInfo.card, checklists: newChks });
                                             }}
                                          />
                                          <span style={{flex: 1, color: item.isComplete ? 'var(--text-muted)' : 'var(--text-main)', textDecoration: item.isComplete ? 'line-through' : 'none'}}>{item.text}</span>
                                          <button onClick={(e) => {
                                              e.preventDefault();
                                              const newChks = [...selectedCardInfo.card.checklists];
                                              newChks[chkIdx].items.splice(itemIdx, 1);
                                              updateCardDetails({ ...selectedCardInfo.card, checklists: newChks });
                                          }} style={{border:'none', background:'none', color:'var(--text-muted)', cursor:'pointer', fontSize: '18px'}}>×</button>
                                       </label>
                                    ))}
                                 </div>

                                 <button className="modal-btn" onClick={() => {
                                     const itemText = prompt("Checklist item:");
                                     if (!itemText) return;
                                     const newChks = [...selectedCardInfo.card.checklists];
                                     newChks[chkIdx].items.push({ id: `i-${Date.now()}`, text: itemText, isComplete: false });
                                     updateCardDetails({ ...selectedCardInfo.card, checklists: newChks });
                                 }}>Add Item</button>
                              </div>
                          ))}
                      </div>

                      <div style={{marginBottom: 24}}>
                          <label className="modal-label">Activity & Comments</label>
                          <div style={{display:'flex', gap: 8, marginBottom: 16}}>
                              <div style={{width:32, height:32, borderRadius:'50%', background:'#dfe1e6', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#172b4d'}}>Y</div>
                              <div style={{flex: 1}}>
                                 <input 
                                    className="modal-input"
                                    placeholder="Write a comment..."
                                    style={{marginBottom: 8}}
                                    id="comment-input"
                                    onKeyDown={(e) => {
                                        if(e.key === 'Enter' && e.target.value.trim() !== '') {
                                            const newComment = { id: `comm-${Date.now()}`, text: e.target.value, author: "You", timestamp: new Date().toISOString() };
                                            updateCardDetails({ ...selectedCardInfo.card, comments: [...(selectedCardInfo.card.comments || []), newComment] });
                                            e.target.value = '';
                                        }
                                    }}
                                 />
                                 <div style={{fontSize: 12, color:'var(--text-muted)'}}>Press Enter to post</div>
                              </div>
                          </div>

                          <div style={{display:'flex', flexDirection:'column', gap: 16}}>
                             {(selectedCardInfo.card.comments || []).slice().reverse().map(comm => (
                                <div key={comm.id} style={{display:'flex', gap: 8}}>
                                    <div style={{width:32, height:32, borderRadius:'50%', background:'#dfe1e6', flexShrink:0, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:700, fontSize:12, color:'#172b4d'}}>{comm.author[0]}</div>
                                    <div>
                                       <div style={{fontWeight:600, fontSize: 13, marginBottom:4, color:'var(--text-main)'}}>
                                          {comm.author} <span style={{fontWeight:400, color:'var(--text-muted)', fontSize: 11, marginLeft: 4}}>{new Date(comm.timestamp).toLocaleString()}</span>
                                       </div>
                                       <div style={{background:'white', padding:'8px 12px', borderRadius:'8px', boxShadow:'var(--shadow-sm)', fontSize: 14, color:'var(--text-main)', display:'inline-block'}}>
                                           {comm.text}
                                       </div>
                                    </div>
                                </div>
                             ))}
                          </div>
                      </div>

                   </div>

                   <div className="modal-sidebar-actions" style={{width: '200px', display:'flex', flexDirection:'column', gap: 16, flexShrink:0}}>
                       
                       <div style={{fontWeight: 600, fontSize: 12, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '-8px'}}>Add to card</div>

                       <div>
                           <label className="modal-label">Assignees</label>
                           <div style={{display:'flex', flexDirection:'column', gap:'8px', background: 'white', border: '1px solid #dfe1e6', padding: '8px', borderRadius: '4px'}}>
                           {mockMembers.map(m => (
                               <label key={m.id} style={{display:'flex', alignItems:'center', gap:'8px', cursor:'pointer', fontSize: 14}}>
                                   <input 
                                      type="checkbox"
                                      checked={selectedCardInfo.card.members?.includes(m.id)}
                                      onChange={(e) => {
                                          let newMembers = [...(selectedCardInfo.card.members || [])];
                                          if (e.target.checked) newMembers.push(m.id);
                                          else newMembers = newMembers.filter(id => id !== m.id);
                                          updateCardDetails({ ...selectedCardInfo.card, members: newMembers });
                                      }}
                                   />
                                   <div style={{width:24, height:24, borderRadius:'50%', background:'#dfe1e6', color:'#172b4d', display:'flex', alignItems:'center', justifyContent:'center', fontSize:10, fontWeight:'600'}}>{m.initial}</div>
                                   <span>{m.name}</span>
                               </label>
                           ))}
                           </div>
                       </div>

                       <div>
                           <label className="modal-label">Labels</label>
                           <div style={{display:'flex', flexDirection:'column', gap:'6px'}}>
                           {mockLabels.map(l => (
                               <div 
                                  key={l.id} 
                                  onClick={() => {
                                      let newLabels = [...(selectedCardInfo.card.labels || [])];
                                      if (newLabels.includes(l.id)) newLabels = newLabels.filter(id => id !== l.id);
                                      else newLabels.push(l.id);
                                      updateCardDetails({ ...selectedCardInfo.card, labels: newLabels });
                                  }}
                                  style={{
                                      background: l.color,
                                      color: 'white',
                                      padding: '6px 12px',
                                      borderRadius: '4px',
                                      cursor: 'pointer',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      fontWeight: 500,
                                      fontSize: 14,
                                      opacity: selectedCardInfo.card.labels?.includes(l.id) ? 1 : 0.7
                                  }}
                               >
                                   {l.name}
                                   {selectedCardInfo.card.labels?.includes(l.id) && <span>✓</span>}
                               </div>
                           ))}
                           </div>
                       </div>

                       <div>
                           <label className="modal-label" style={{marginTop: '8px'}}>Cover URL</label>
                           <input 
                               type="text" 
                               placeholder="https://..."
                               value={selectedCardInfo.card.cover || ""}
                               onChange={(e) => updateCardDetails({ ...selectedCardInfo.card, cover: e.target.value })}
                               className="modal-input"
                           />
                       </div>

                       <div>
                           <label className="modal-label" style={{marginTop: '8px'}}>Due Date</label>
                           <input 
                               type="date" 
                               value={selectedCardInfo.card.dueDate || ""}
                               onChange={(e) => updateCardDetails({ ...selectedCardInfo.card, dueDate: e.target.value })}
                               className="modal-input"
                           />
                       </div>

                       <div style={{marginTop: '16px'}}>
                           <button 
                              className="modal-btn-danger"
                              onClick={() => deleteCard(selectedCardInfo.listId, selectedCardInfo.cardId)}
                           >
                               Delete Task
                           </button>
                       </div>
                   </div>
               </div>
            </div>
         </div>
      )}

    </div>
  );
}

export default App;