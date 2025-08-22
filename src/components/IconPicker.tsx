import { useState } from "react"
import {
  Home, Menu, Search, Settings, User, Bell, Mail, MessageSquare, 
  Calendar, Clock, MapPin, Globe, Shield, Lock, Eye, EyeOff,
  Plus, Minus, Edit, Trash2, Download, Upload, Share, Copy, 
  Save, RotateCcw, RotateCw, ZoomIn, ZoomOut,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown,
  ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, TrendingUp, TrendingDown,
  Image, Camera, Video, Music, File, FileText, Folder, FolderOpen,
  Book, Bookmark, Tag, Hash, Link, ExternalLink,
  Phone, Smartphone, Tablet, Monitor, Wifi, WifiOff, Bluetooth,
  Headphones, Mic, MicOff, Volume2, VolumeOff,
  ShoppingCart, CreditCard, DollarSign, Package, Truck, Gift,
  Heart, Star, Award, Trophy, Target,
  Users, UserPlus, UserMinus, Users2, Smile, ThumbsUp, ThumbsDown,
  MessageCircle, AtSign, Send, Share2, Rss,
  CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle,
  Zap, Flame, Sun, Moon, Cloud, CloudRain,
  Wrench, Hammer, Scissors, Paperclip, Pin, Flag, Compass,
  Calculator, Terminal, Code, Database, Server, Cpu,
  X
} from "lucide-react"

interface IconPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelectIcon: (iconName: string) => void
}

const iconCategories = {
  "Navigation & UI": {
    icons: [Home, Menu, Search, Settings, User, Bell, Mail, MessageSquare, Calendar, Clock, MapPin, Globe, Shield, Lock, Eye, EyeOff],
    names: ["Home", "Menu", "Search", "Settings", "User", "Bell", "Mail", "MessageSquare", "Calendar", "Clock", "MapPin", "Globe", "Shield", "Lock", "Eye", "EyeOff"]
  },
  "Actions": {
    icons: [Plus, Minus, Edit, Trash2, Download, Upload, Share, Copy, Save, RotateCcw, RotateCw, ZoomIn, ZoomOut],
    names: ["Plus", "Minus", "Edit", "Trash2", "Download", "Upload", "Share", "Copy", "Save", "RotateCcw", "RotateCw", "ZoomIn", "ZoomOut"]
  },
  "Arrows": {
    icons: [ArrowUp, ArrowDown, ArrowLeft, ArrowRight, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ChevronsUp, ChevronsDown, TrendingUp, TrendingDown],
    names: ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "ChevronUp", "ChevronDown", "ChevronLeft", "ChevronRight", "ChevronsUp", "ChevronsDown", "TrendingUp", "TrendingDown"]
  },
  "Content & Media": {
    icons: [Image, Camera, Video, Music, File, FileText, Folder, FolderOpen, Book, Bookmark, Tag, Hash, Link, ExternalLink],
    names: ["Image", "Camera", "Video", "Music", "File", "FileText", "Folder", "FolderOpen", "Book", "Bookmark", "Tag", "Hash", "Link", "ExternalLink"]
  },
  "Devices": {
    icons: [Phone, Smartphone, Tablet, Monitor, Wifi, WifiOff, Bluetooth, Headphones, Mic, MicOff, Volume2, VolumeOff],
    names: ["Phone", "Smartphone", "Tablet", "Monitor", "Wifi", "WifiOff", "Bluetooth", "Headphones", "Mic", "MicOff", "Volume2", "VolumeOff"]
  },
  "Shopping": {
    icons: [ShoppingCart, CreditCard, DollarSign, Package, Truck, Gift, Heart, Star, Award, Trophy, Target, TrendingUp],
    names: ["ShoppingCart", "CreditCard", "DollarSign", "Package", "Truck", "Gift", "Heart", "Star", "Award", "Trophy", "Target", "TrendingUp"]
  },
  "Social": {
    icons: [Users, UserPlus, UserMinus, Users2, Smile, ThumbsUp, ThumbsDown, MessageCircle, AtSign, Send, Share2, Rss],
    names: ["Users", "UserPlus", "UserMinus", "Users2", "Smile", "ThumbsUp", "ThumbsDown", "MessageCircle", "AtSign", "Send", "Share2", "Rss"]
  },
  "Status": {
    icons: [CheckCircle, XCircle, AlertCircle, AlertTriangle, Info, HelpCircle, Zap, Flame, Sun, Moon, Cloud, CloudRain],
    names: ["CheckCircle", "XCircle", "AlertCircle", "AlertTriangle", "Info", "HelpCircle", "Zap", "Flame", "Sun", "Moon", "Cloud", "CloudRain"]
  },
  "Tools": {
    icons: [Wrench, Hammer, Scissors, Paperclip, Pin, Flag, Compass, Calculator, Terminal, Code, Database, Server, Cpu],
    names: ["Wrench", "Hammer", "Scissors", "Paperclip", "Pin", "Flag", "Compass", "Calculator", "Terminal", "Code", "Database", "Server", "Cpu"]
  }
}

export default function IconPicker({ isOpen, onClose, onSelectIcon }: IconPickerProps) {
  const [activeCategory, setActiveCategory] = useState<keyof typeof iconCategories>("Navigation & UI")
  const [searchTerm, setSearchTerm] = useState("")

  if (!isOpen) return null

  const filteredIcons = searchTerm 
    ? Object.values(iconCategories).flatMap(category => 
        category.names
          .map((name, index) => ({ icon: category.icons[index], name }))
          .filter(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : iconCategories[activeCategory].icons.map((icon, index) => ({
        icon,
        name: iconCategories[activeCategory].names[index]
      }))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl w-[800px] h-[600px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Choose an Icon</h2>
          <button 
            onClick={onClose}
            className="p-1 transition-colors rounded-lg hover:bg-gray-100"
          >
            <X size={20} />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b">
          <div className="relative">
            <Search className="absolute text-gray-400 transform -translate-y-1/2 left-3 top-1/2" size={16} />
            <input
              type="text"
              placeholder="Search icons..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full py-2 pl-10 pr-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex flex-1 min-h-0">
          {/* Categories Sidebar */}
          {!searchTerm && (
            <div className="w-48 p-2 overflow-y-auto border-r bg-gray-50">
              {Object.keys(iconCategories).map((category) => (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category as keyof typeof iconCategories)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    activeCategory === category 
                      ? 'bg-blue-500 text-white' 
                      : 'hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          )}

          {/* Icons Grid */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="grid grid-cols-8 gap-2">
              {filteredIcons.map((item, index) => {
                const IconComponent = item.icon
                return (
                  <button
                    key={`${item.name}-${index}`}
                    onClick={() => {
                      onSelectIcon(item.name)
                      onClose()
                    }}
                    className="flex flex-col items-center gap-1 p-3 transition-colors border rounded-lg hover:border-blue-500 hover:bg-blue-50 group"
                    title={item.name}
                  >
                    <IconComponent size={20} className="text-gray-600 group-hover:text-blue-600" />
                    <span className="w-full text-xs text-center text-gray-500 truncate">
                      {item.name}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 text-sm text-gray-600 border-t bg-gray-50">
          Click on an icon to add it to your wireframe
        </div>
      </div>
    </div>
  )
}