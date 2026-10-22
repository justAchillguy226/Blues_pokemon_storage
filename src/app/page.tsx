'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BACKGROUND_PRESETS,
  BALL_OPTIONS,
  BackgroundStyle,
  BallType,
  COSTUME_PRESETS,
  GBL_INFO_OPTIONS,
  InventoryStatus,
  PokemonStorageItem,
  SEARCH_FILTER_OPTIONS,
  TAG_OPTIONS,
} from '@/lib/types';
import {
  POKEMON_SPECIES_LIST,
  formatDexNumber,
  getSpeciesByDex,
} from '@/lib/pokedex';
import { BallIcon } from '@/components/BallIcon';
import {
  PokemonCard,
  buildCardDisplayTitle,
  fileToCompressedDataUrl,
  getAccountColor,
} from '@/components/PokemonCard';

type SortOption = 'dex_asc' | 'dex_desc' | 'account_asc' | 'account_desc';

export default function BluesPokemonStoragePage() {
  const [items, setItems] = useState<PokemonStorageItem[]>([]);
  const [accounts, setAccounts] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState('');

  // Admin auth states
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  // Search, Filter & Sort states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('ALL');
  const [activeSearchFilters, setActiveSearchFilters] = useState<string[]>([]);
  const [statusFilter, setStatusFilter] = useState<'ALL' | InventoryStatus>('ALL');
  const [activeTagFilters, setActiveTagFilters] = useState<string[]>([]);
  const [activeGblFilters, setActiveGblFilters] = useState<string[]>([]);
  const [activeBallFilter, setActiveBallFilter] = useState<BallType>('');
  const [sortBy, setSortBy] = useState<SortOption>('dex_asc');

  // Account management state
  const [showAccountInput, setShowAccountInput] = useState(false);
  const [newAccountName, setNewAccountName] = useState('');

  // Form Modal state for Add / Edit Pokemon
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Full-size screenshot lightbox preview
  const [lightboxItem, setLightboxItem] = useState<PokemonStorageItem | null>(null);

  // Client-only Reservation Modal state (僅客戶端未登入可使用，主控端看不到)
  const [reservingItem, setReservingItem] = useState<PokemonStorageItem | null>(null);
  const [reserveThreadsCode, setReserveThreadsCode] = useState('');
  const [reserveAgreed, setReserveAgreed] = useState(false);
  const [reserveError, setReserveError] = useState('');
  const [reserving, setReserving] = useState(false);

  // Add/Edit Form fields
  const [speciesSearch, setSpeciesSearch] = useState('');
  const [formDexNumber, setFormDexNumber] = useState<number>(1);
  const [formAccount, setFormAccount] = useState<string>('__new__');
  const [formCustomAccount, setFormCustomAccount] = useState<string>('');
  const [formStatus, setFormStatus] = useState<InventoryStatus>('inventory');
  const [formTradePartner, setFormTradePartner] = useState<string>('');
  const [formSoldPrice, setFormSoldPrice] = useState<string>('50NTD');
  const [formScreenshotUrl, setFormScreenshotUrl] = useState<string>('');
  const [formIsShiny, setFormIsShiny] = useState<boolean>(true);
  const [formIsLegendary, setFormIsLegendary] = useState<boolean>(false);
  const [formIsUltraBeast, setFormIsUltraBeast] = useState<boolean>(false);
  const [formIsCostume, setFormIsCostume] = useState<boolean>(false);
  const [formCostumePreset, setFormCostumePreset] = useState<string>('');
  const [formCostumeCustom, setFormCostumeCustom] = useState<string>('');
  const [formBgPreset, setFormBgPreset] = useState<BackgroundStyle>('none');
  const [formBgCustomName, setFormBgCustomName] = useState<string>('');
  const [formIsLocationCard, setFormIsLocationCard] = useState<boolean>(false);
  const [formIsGigantamax, setFormIsGigantamax] = useState<boolean>(false);
  const [formTags, setFormTags] = useState<string[]>([]);
  const [formCustomTag, setFormCustomTag] = useState<string>('');
  const [formGblTags, setFormGblTags] = useState<string[]>([]);
  const [formBall, setFormBall] = useState<BallType>('poke');
  const [formNotes, setFormNotes] = useState<string>('');

  const modalFileInputRef = useRef<HTMLInputElement | null>(null);
  const backupFileInputRef = useRef<HTMLInputElement | null>(null);

  async function loadData() {
    setLoading(true);
    try {
      const [pokemonRes, authRes] = await Promise.all([
        fetch('/api/pokemon'),
        fetch('/api/auth'),
      ]);
      if (pokemonRes.ok) {
        const data = await pokemonRes.json();
        setItems(data.items || []);
        setAccounts(data.accounts || []);
      }
      if (authRes.ok) {
        const authData = await authRes.json();
        setIsAdmin(Boolean(authData.isAdmin));
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  function flashMessage(msg: string) {
    setStatusMsg(msg);
    setTimeout(() => {
      setStatusMsg((prev) => (prev === msg ? '' : prev));
    }, 2800);
  }

  async function handleAdminLoginSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!adminPasswordInput) return;
    setLoggingIn(true);
    setLoginError('');
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPasswordInput }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || '密碼驗證失敗');
      } else {
        setIsAdmin(true);
        setShowLoginModal(false);
        setReservingItem(null);
        setAdminPasswordInput('');
        setLoginError('');
        flashMessage('🔓 管理員登入成功！已解鎖編輯權限');
      }
    } catch {
      setLoginError('登入請求發生錯誤');
    } finally {
      setLoggingIn(false);
    }
  }

  async function handleAdminLogout() {
    await fetch('/api/auth', { method: 'DELETE' });
    setIsAdmin(false);
    setShowFormModal(false);
    setShowAccountInput(false);
    flashMessage('🔒 已登出管理員模式（目前為訪客唯讀視角）');
  }

  function openReserveModal(item: PokemonStorageItem) {
    if (isAdmin || item.status !== 'sold') return;
    setReservingItem(item);
    setReserveThreadsCode('');
    setReserveAgreed(false);
    setReserveError('');
  }

  function formatDeclarationPrice(rawPrice: string): string {
    const trimmed = (rawPrice || '50NTD').trim();
    const withoutNtd = trimmed.replace(/\s*NTD$/i, '').trim();
    return `${withoutNtd || '50'} NTD`;
  }

  async function handleReserveSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isAdmin || !reservingItem) return;
    if (reservingItem.status !== 'sold') {
      setReserveError('只有標示為「出售」的寶可夢才能進行預約！');
      return;
    }

    const cleanThreads = reserveThreadsCode.trim().replace(/^@+/, '');
    if (cleanThreads.length < 5 || cleanThreads.length > 7) {
      setReserveError(
        `Threads 帳號前 5～7 碼字元數不符（目前為 ${cleanThreads.length} 碼），請填入 5～7 個字元！`
      );
      return;
    }

    if (!reserveAgreed) {
      setReserveError('請先勾選確認同意下方預約聲明！');
      return;
    }

    setReserving(true);
    setReserveError('');
    try {
      const res = await fetch('/api/pokemon/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: reservingItem.id,
          threadsCode: cleanThreads,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setReserveError(data.error || '預約失敗，請稍後再試');
      } else {
        setItems((prev) =>
          prev.map((it) => (it.id === reservingItem.id ? data.item : it))
        );
        setReservingItem(null);
        flashMessage(
          `🎉 預約成功！已為 Threads 帳號「${cleanThreads}」保留「${reservingItem.nameZh}」！`
        );
      }
    } catch {
      setReserveError('網路連線異常，請稍後再試');
    } finally {
      setReserving(false);
    }
  }

  function handleExportBackup() {
    const payload = {
      exportedAt: new Date().toISOString(),
      accounts,
      items,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blues_pokemon_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    flashMessage('⬇️ 已匯出完整倉庫備份檔 (JSON)');
  }

  async function handleImportBackupFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const res = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed),
      });
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setAccounts(data.accounts || []);
        flashMessage(
          `⬆️ 成功匯入 ${data.importedItems || 0} 隻寶可夢與 ${data.importedAccounts || 0} 個帳號！`
        );
      } else {
        const err = await res.json();
        flashMessage(`❌ ${err.error || '匯入失敗'}`);
      }
    } catch {
      flashMessage('❌ 備份檔案格式不正確');
    } finally {
      e.target.value = '';
    }
  }

  // Species selector options filtered by speciesSearch
  const filteredSpeciesOptions = useMemo(() => {
    const q = speciesSearch.trim().toLowerCase();
    if (!q) return POKEMON_SPECIES_LIST;
    return POKEMON_SPECIES_LIST.filter((sp) => {
      const dexStr = String(sp.dexNumber);
      const paddedDex = String(sp.dexNumber).padStart(4, '0');
      return (
        dexStr.includes(q) ||
        paddedDex.includes(q) ||
        sp.nameZh.toLowerCase().includes(q) ||
        sp.nameEn.toLowerCase().includes(q)
      );
    });
  }, [speciesSearch]);

  function handleSelectSpecies(dex: number) {
    setFormDexNumber(dex);
    const sp = getSpeciesByDex(dex);
    setFormIsLegendary(sp.isLegendary);
    setFormIsUltraBeast(sp.isUltraBeast);
  }

  function openCreateForm() {
    if (!isAdmin) return;
    setEditingId(null);
    setSpeciesSearch('');
    setFormDexNumber(1);
    setFormAccount(
      selectedAccountFilter !== 'ALL'
        ? selectedAccountFilter
        : accounts[0] || '__new__'
    );
    setFormCustomAccount('');
    setFormStatus(statusFilter !== 'ALL' ? statusFilter : 'inventory');
    setFormTradePartner('');
    setFormSoldPrice('50NTD');
    setFormScreenshotUrl('');
    setFormIsShiny(true);
    setFormIsLegendary(false);
    setFormIsUltraBeast(false);
    setFormIsCostume(false);
    setFormCostumePreset('');
    setFormCostumeCustom('');
    setFormBgPreset('none');
    setFormBgCustomName('');
    setFormIsLocationCard(false);
    setFormIsGigantamax(false);
    setFormTags([]);
    setFormCustomTag('');
    setFormGblTags([]);
    setFormBall('poke');
    setFormNotes('');
    setShowFormModal(true);
  }

  function openEditForm(item: PokemonStorageItem) {
    if (!isAdmin) return;
    setEditingId(item.id);
    setSpeciesSearch('');
    setFormDexNumber(item.dexNumber);
    setFormAccount(item.account);
    setFormCustomAccount('');
    setFormStatus(item.status);
    setFormTradePartner(item.tradePartner || '');
    setFormSoldPrice(item.soldPrice || '50NTD');
    setFormScreenshotUrl(item.screenshotUrl || '');
    setFormIsShiny(item.isShiny);
    setFormIsLegendary(item.isLegendary);
    setFormIsUltraBeast(item.isUltraBeast);
    setFormIsCostume(item.isCostume);
    const matchingCostume = COSTUME_PRESETS.some((c) => c.value === item.costumeName);
    if (matchingCostume) {
      setFormCostumePreset(item.costumeName);
      setFormCostumeCustom('');
    } else {
      setFormCostumePreset(item.costumeName ? '__custom__' : '');
      setFormCostumeCustom(item.costumeName);
    }
    setFormBgPreset(item.backgroundStyle || 'none');
    setFormBgCustomName(item.backgroundName || '');
    setFormIsLocationCard(item.isLocationCard);
    setFormIsGigantamax(item.isGigantamax);
    setFormTags([...item.tags]);
    setFormCustomTag('');
    setFormGblTags([...item.gblTags]);
    setFormBall(item.ball || '');
    setFormNotes(item.notes || '');
    setShowFormModal(true);
  }

  function handleBackgroundPresetChange(style: BackgroundStyle) {
    setFormBgPreset(style);
    const preset = BACKGROUND_PRESETS.find((b) => b.style === style);
    if (preset) {
      setFormBgCustomName(preset.name);
      setFormIsLocationCard(preset.isLocationCard);
    }
  }

  async function handleModalScreenshotSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const dataUrl = await fileToCompressedDataUrl(file);
    setFormScreenshotUrl(dataUrl);
    e.target.value = '';
  }

  async function handleModalPaste(e: React.ClipboardEvent) {
    const list = e.clipboardData?.items;
    if (!list) return;
    for (let i = 0; i < list.length; i++) {
      const clipItem = list[i];
      if (clipItem.type.startsWith('image/')) {
        const file = clipItem.getAsFile();
        if (file) {
          e.preventDefault();
          const dataUrl = await fileToCompressedDataUrl(file);
          setFormScreenshotUrl(dataUrl);
          flashMessage('📷 已從剪貼簿貼上實際截圖！');
          return;
        }
      }
    }
  }

  async function handleModalDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer?.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const dataUrl = await fileToCompressedDataUrl(file);
      setFormScreenshotUrl(dataUrl);
    }
  }

  // Inline update screenshot directly from a card in the grid (Admin only)
  async function handleQuickUpdateScreenshot(
    item: PokemonStorageItem,
    newScreenshotUrl: string
  ) {
    if (!isAdmin) return;
    const res = await fetch('/api/pokemon', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...item,
        screenshotUrl: newScreenshotUrl,
      }),
    });
    if (res.ok) {
      const data = await res.json();
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? data.item : it))
      );
      flashMessage(newScreenshotUrl ? '📷 已儲存寶可夢實際截圖！' : '🗑️ 已移除截圖');
    }
  }

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin) return;
    const species = getSpeciesByDex(formDexNumber);
    const finalAccount =
      formAccount === '__new__'
        ? formCustomAccount.trim() || '未分類'
        : formAccount || '未分類';

    const finalCostumeName =
      formCostumePreset === '__custom__'
        ? formCostumeCustom.trim()
        : formCostumePreset.trim();
    const finalIsCostume = Boolean(formIsCostume || finalCostumeName);

    const finalHasBg = Boolean(formBgPreset !== 'none' || formBgCustomName.trim());

    const payload = {
      id: editingId || undefined,
      dexNumber: species.dexNumber,
      nameZh: species.nameZh,
      nameEn: species.nameEn,
      account: finalAccount,
      status: formStatus,
      tradePartner: formTradePartner.trim(),
      soldPrice: formSoldPrice.trim() || '50NTD',
      screenshotUrl: formScreenshotUrl,
      isShiny: formIsShiny,
      isLegendary: formIsLegendary,
      isUltraBeast: formIsUltraBeast,
      isCostume: finalIsCostume,
      costumeName: finalIsCostume ? finalCostumeName : '',
      hasBackground: finalHasBg,
      isLocationCard: formIsLocationCard,
      backgroundStyle: finalHasBg ? formBgPreset : 'none',
      backgroundName: finalHasBg ? formBgCustomName.trim() : '',
      isGigantamax: formIsGigantamax,
      tags: formTags,
      gblTags: formGblTags,
      ball: formBall,
      notes: formNotes.trim(),
    };

    const method = editingId ? 'PUT' : 'POST';
    const res = await fetch('/api/pokemon', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.accounts) setAccounts(data.accounts);
      await loadData();
      setShowFormModal(false);
      flashMessage(editingId ? '✅ 已更新寶可夢資料！' : '✅ 已新增寶可夢至倉庫！');
    } else if (res.status === 401) {
      setIsAdmin(false);
      flashMessage('⚠️ 管理員憑證已過期，請重新登入');
    }
  }

  async function handleDeletePokemon(id: string) {
    if (!isAdmin) return;
    const res = await fetch(`/api/pokemon?id=${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setItems((prev) => prev.filter((it) => it.id !== id));
      flashMessage('🗑️ 已刪除寶可夢');
    }
  }

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    if (!isAdmin || !newAccountName.trim()) return;
    const res = await fetch('/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newAccountName.trim() }),
    });
    if (res.ok) {
      const data = await res.json();
      setAccounts(data.accounts || []);
      setNewAccountName('');
      setShowAccountInput(false);
      flashMessage(`✅ 已新增帳號「${newAccountName.trim()}」`);
    }
  }

  // Counts for each status classification
  const wishlistCount = useMemo(
    () => items.filter((i) => i.status === 'wishlist').length,
    [items]
  );
  const inventoryCount = useMemo(
    () => items.filter((i) => i.status === 'inventory').length,
    [items]
  );
  const scheduledTradeCount = useMemo(
    () => items.filter((i) => i.status === 'scheduled_trade').length,
    [items]
  );
  const soldCount = useMemo(
    () => items.filter((i) => i.status === 'sold').length,
    [items]
  );

  // Account counts
  const accountCounts = useMemo(() => {
    const map: Record<string, number> = {};
    items.forEach((it) => {
      map[it.account] = (map[it.account] || 0) + 1;
    });
    return map;
  }, [items]);

  // Toggle functions for Search Filters, Tags, GBL, Ball
  function toggleSearchFilter(filterId: string) {
    setActiveSearchFilters((prev) =>
      prev.includes(filterId) ? prev.filter((f) => f !== filterId) : [...prev, filterId]
    );
  }

  function toggleTagFilter(tag: string) {
    setActiveTagFilters((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }

  function toggleGblFilter(gbl: string) {
    setActiveGblFilters((prev) =>
      prev.includes(gbl) ? prev.filter((g) => g !== gbl) : [...prev, gbl]
    );
  }

  function toggleBallFilter(ball: BallType) {
    setActiveBallFilter((prev) => (prev === ball ? '' : ball));
  }

  function clearAllFilters() {
    setSearchQuery('');
    setSelectedAccountFilter('ALL');
    setActiveSearchFilters([]);
    setStatusFilter('ALL');
    setActiveTagFilters([]);
    setActiveGblFilters([]);
    setActiveBallFilter('');
  }

  const hasAnyActiveFilter =
    searchQuery.trim() !== '' ||
    selectedAccountFilter !== 'ALL' ||
    activeSearchFilters.length > 0 ||
    statusFilter !== 'ALL' ||
    activeTagFilters.length > 0 ||
    activeGblFilters.length > 0 ||
    activeBallFilter !== '';

  // Filtered and Sorted Pokemon items
  const filteredAndSortedItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    const filtered = items.filter((item) => {
      if (selectedAccountFilter !== 'ALL' && item.account !== selectedAccountFilter) {
        return false;
      }

      if (statusFilter !== 'ALL' && item.status !== statusFilter) {
        return false;
      }

      for (const f of activeSearchFilters) {
        if (f === 'Shiny' && !item.isShiny) return false;
        if (f === 'Legendary' && !item.isLegendary) return false;
        if (f === 'Ultra Beast' && !item.isUltraBeast) return false;
        if (f === 'Costume' && !item.isCostume) return false;
        if (f === 'Background' && !item.hasBackground) return false;
        if (f === 'Location Card' && !item.isLocationCard) return false;
        if (f === 'Gigantamax' && !item.isGigantamax) return false;
      }

      for (const t of activeTagFilters) {
        if (!item.tags.includes(t)) return false;
      }

      for (const g of activeGblFilters) {
        if (!item.gblTags.includes(g)) return false;
      }

      if (activeBallFilter && item.ball !== activeBallFilter) {
        return false;
      }

      if (q) {
        const ballInfo = BALL_OPTIONS.find((b) => b.id === item.ball);
        const searchableText = [
          item.nameZh,
          item.nameEn,
          String(item.dexNumber),
          formatDexNumber(item.dexNumber),
          String(item.dexNumber).padStart(4, '0'),
          item.account,
          item.tradePartner,
          item.soldPrice,
          item.status === 'inventory' ? 'inventory 在庫存中 庫存' : '',
          item.status === 'wishlist' ? 'wishlist 在願望清單 願望' : '',
          item.status === 'scheduled_trade' ? '已排定交易 預留 交換' : '',
          item.status === 'sold' ? '出售 售出 已售' : '',
          item.costumeName,
          item.backgroundName,
          buildCardDisplayTitle(item),
          item.notes,
          ...item.tags,
          ...item.gblTags,
          ballInfo ? `${ballInfo.nameEn} ${ballInfo.nameZh} ${ballInfo.id}` : '',
          item.isShiny ? 'shiny 異色 色違 閃光' : '',
          item.isLegendary ? 'legendary 傳說 神獸 幻之' : '',
          item.isUltraBeast ? 'ultra beast 究極異獸' : '',
          item.isCostume ? 'costume 裝扮 帽' : '',
          item.hasBackground ? 'background 背卡 背景' : '',
          item.isLocationCard ? 'location card 地區背卡' : '',
          item.isGigantamax ? 'gigantamax 超極巨化' : '',
        ]
          .join(' ')
          .toLowerCase();

        if (!searchableText.includes(q)) {
          return false;
        }
      }

      return true;
    });

    return [...filtered].sort((a, b) => {
      if (sortBy === 'dex_asc') {
        if (a.dexNumber !== b.dexNumber) return a.dexNumber - b.dexNumber;
        return a.account.localeCompare(b.account, 'zh-Hant');
      }
      if (sortBy === 'dex_desc') {
        if (a.dexNumber !== b.dexNumber) return b.dexNumber - a.dexNumber;
        return a.account.localeCompare(b.account, 'zh-Hant');
      }
      if (sortBy === 'account_asc') {
        const cmp = a.account.localeCompare(b.account, 'zh-Hant');
        if (cmp !== 0) return cmp;
        return a.dexNumber - b.dexNumber;
      }
      if (sortBy === 'account_desc') {
        const cmp = b.account.localeCompare(a.account, 'zh-Hant');
        if (cmp !== 0) return cmp;
        return a.dexNumber - b.dexNumber;
      }
      return 0;
    });
  }, [
    items,
    searchQuery,
    selectedAccountFilter,
    statusFilter,
    activeSearchFilters,
    activeTagFilters,
    activeGblFilters,
    activeBallFilter,
    sortBy,
  ]);

  // Live preview item for the Add/Edit modal
  const previewItem: PokemonStorageItem = useMemo(() => {
    const sp = getSpeciesByDex(formDexNumber);
    const finalCostumeName =
      formCostumePreset === '__custom__'
        ? formCostumeCustom.trim()
        : formCostumePreset.trim();
    const finalIsCostume = Boolean(formIsCostume || finalCostumeName);
    const finalHasBg = Boolean(formBgPreset !== 'none' || formBgCustomName.trim());
    const finalAccount =
      formAccount === '__new__'
        ? formCustomAccount.trim() || '未分類'
        : formAccount || '未分類';

    return {
      id: 'preview',
      dexNumber: sp.dexNumber,
      nameZh: sp.nameZh,
      nameEn: sp.nameEn,
      account: finalAccount,
      status: formStatus,
      tradePartner: formTradePartner.trim(),
      soldPrice: formSoldPrice.trim() || '50NTD',
      screenshotUrl: formScreenshotUrl,
      isShiny: formIsShiny,
      isLegendary: formIsLegendary,
      isUltraBeast: formIsUltraBeast,
      isCostume: finalIsCostume,
      costumeName: finalIsCostume ? finalCostumeName : '',
      hasBackground: finalHasBg,
      isLocationCard: formIsLocationCard,
      backgroundStyle: finalHasBg ? formBgPreset : 'none',
      backgroundName: finalHasBg ? formBgCustomName.trim() : '',
      isGigantamax: formIsGigantamax,
      tags: formTags,
      gblTags: formGblTags,
      ball: formBall,
      notes: formNotes,
      createdAt: '',
    };
  }, [
    formDexNumber,
    formAccount,
    formCustomAccount,
    formStatus,
    formTradePartner,
    formSoldPrice,
    formScreenshotUrl,
    formIsShiny,
    formIsLegendary,
    formIsUltraBeast,
    formIsCostume,
    formCostumePreset,
    formCostumeCustom,
    formBgPreset,
    formBgCustomName,
    formIsLocationCard,
    formIsGigantamax,
    formTags,
    formGblTags,
    formBall,
    formNotes,
  ]);

  function pillButtonStyle(active: boolean): React.CSSProperties {
    return {
      padding: '6px 14px',
      borderRadius: '999px',
      border: active ? '1.5px solid #1e293b' : '1px solid #d8dce3',
      background: active ? '#1e293b' : '#e4e7ec',
      color: active ? '#ffffff' : '#1f2937',
      fontSize: '13.5px',
      fontWeight: active ? 600 : 500,
      cursor: 'pointer',
      transition: 'all 0.12s ease',
      userSelect: 'none',
    };
  }

  return (
    <div>
      {/* Top-Right Admin Login / Status Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          gap: '8px',
          marginBottom: '6px',
        }}
      >
        {isAdmin ? (
          <>
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 700,
                padding: '4px 10px',
                borderRadius: '999px',
                background: '#dcfce7',
                color: '#166534',
                border: '1px solid #86efac',
              }}
            >
              🛡️ 管理員編輯模式
            </span>
            <button
              type="button"
              onClick={handleAdminLogout}
              style={{
                padding: '5px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                background: '#f8fafc',
                color: '#334155',
                fontSize: '12.5px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              登出
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => {
              setLoginError('');
              setAdminPasswordInput('');
              setShowLoginModal(true);
            }}
            style={{
              padding: '6px 14px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#f8fafc',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            🔑 管理員登入
          </button>
        )}
      </div>

      {/* Website Title Header */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <h1
          style={{
            fontSize: '26px',
            fontWeight: 800,
            margin: '0 0 6px 0',
            letterSpacing: '-0.3px',
          }}
        >
          Blues_pokemon_storage
        </h1>
        <div
          style={{
            fontSize: '13px',
            color: '#64748b',
            marginBottom: '12px',
          }}
        >
          多帳號寶可夢管理倉庫｜支援全圖鑑 No.0001 ～ No.1025、實際遊戲截圖、排定交易與出售管理
        </div>

        {/* Action Buttons Bar (Admin Write Buttons only shown when isAdmin === true) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >
          {isAdmin && (
            <>
              <button
                type="button"
                onClick={openCreateForm}
                style={{
                  padding: '8px 18px',
                  borderRadius: '8px',
                  border: '1px solid #1d4ed8',
                  background: '#2563eb',
                  color: '#ffffff',
                  fontWeight: 700,
                  fontSize: '14px',
                  cursor: 'pointer',
                  boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
                }}
              >
                ＋ 新增寶可夢 (Add Pokémon)
              </button>

              <button
                type="button"
                onClick={() => setShowAccountInput((prev) => !prev)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  color: '#334155',
                  fontWeight: 600,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                }}
              >
                👤 ＋新增帳號分類
              </button>

              <button
                type="button"
                onClick={handleExportBackup}
                title="匯出所有寶可夢與帳號備份檔 (JSON)"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                ⬇️ 匯出備份
              </button>

              <input
                ref={backupFileInputRef}
                type="file"
                accept="application/json,.json"
                onChange={handleImportBackupFile}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => backupFileInputRef.current?.click()}
                title="匯入 JSON 備份檔至目前資料庫"
                style={{
                  padding: '8px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  color: '#475569',
                  fontWeight: 600,
                  fontSize: '12.5px',
                  cursor: 'pointer',
                }}
              >
                ⬆️ 匯入備份
              </button>
            </>
          )}

          {hasAnyActiveFilter && (
            <button
              type="button"
              onClick={clearAllFilters}
              style={{
                padding: '8px 14px',
                borderRadius: '8px',
                border: '1px solid #fca5a5',
                background: '#fef2f2',
                color: '#b91c1c',
                fontWeight: 600,
                fontSize: '13px',
                cursor: 'pointer',
              }}
            >
              ✕ 清除所有篩選條件
            </button>
          )}
        </div>

        {statusMsg && (
          <div
            style={{
              marginTop: '10px',
              fontSize: '13.5px',
              fontWeight: 700,
              color: '#047857',
            }}
          >
            {statusMsg}
          </div>
        )}
      </div>

      {/* Quick Add Account Form (Admin only) */}
      {isAdmin && showAccountInput && (
        <form
          onSubmit={handleAddAccount}
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '14px',
            padding: '10px 14px',
            background: '#f8fafc',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
          }}
        >
          <input
            type="text"
            value={newAccountName}
            onChange={(e) => setNewAccountName(e.target.value)}
            placeholder="輸入新帳號名稱（例如：主帳、小帳A、交換帳）..."
            style={{
              padding: '6px 12px',
              border: '1px solid #cbd5e1',
              borderRadius: '6px',
              fontSize: '14px',
              minWidth: '260px',
            }}
          />
          <button
            type="submit"
            style={{
              padding: '6px 14px',
              borderRadius: '6px',
              border: '1px solid #1e293b',
              background: '#1e293b',
              color: '#fff',
              fontWeight: 600,
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            確認新增帳號
          </button>
          <button
            type="button"
            onClick={() => setShowAccountInput(false)}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #cbd5e1',
              background: '#fff',
              fontSize: '13px',
              cursor: 'pointer',
            }}
          >
            取消
          </button>
        </form>
      )}

      {/* Search Input */}
      <div style={{ marginBottom: '18px' }}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search Pokémon（搜尋寶可夢名稱、編號、帳號、交易對象、價格、特定 Tag 或球種...）"
          style={{
            width: '100%',
            padding: '13px 16px',
            fontSize: '16px',
            border: '1px solid #dcdcdc',
            borderRadius: '8px',
            outline: 'none',
            boxSizing: 'border-box',
            color: '#1f2937',
          }}
        />
      </div>

      {/* Account Classification Filter Bar (帳號分類) */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '15px',
            fontWeight: 700,
            marginBottom: '8px',
            color: '#111827',
          }}
        >
          Account Filters (帳號分類):
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <button
            type="button"
            onClick={() => setSelectedAccountFilter('ALL')}
            style={pillButtonStyle(selectedAccountFilter === 'ALL')}
          >
            全部帳號 ({items.length})
          </button>
          {accounts.map((acc) => {
            const active = selectedAccountFilter === acc;
            const color = getAccountColor(acc);
            const cnt = accountCounts[acc] || 0;
            return (
              <button
                key={acc}
                type="button"
                onClick={() =>
                  setSelectedAccountFilter((prev) => (prev === acc ? 'ALL' : acc))
                }
                style={{
                  padding: '6px 14px',
                  borderRadius: '999px',
                  border: active
                    ? `2px solid ${color.text}`
                    : `1px solid ${color.border}`,
                  background: active ? color.text : color.bg,
                  color: active ? '#ffffff' : color.text,
                  fontSize: '13.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                👤 {acc} ({cnt})
              </button>
            );
          })}
        </div>
      </div>

      {/* Search Filters */}
      <div style={{ textAlign: 'center', marginBottom: '18px' }}>
        <div
          style={{
            fontSize: '17px',
            fontWeight: 700,
            marginBottom: '10px',
            color: '#111827',
          }}
        >
          Search Filters:
        </div>

        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            maxWidth: '760px',
            margin: '0 auto',
          }}
        >
          {SEARCH_FILTER_OPTIONS.map((f) => {
            const active = activeSearchFilters.includes(f.id);
            return (
              <button
                key={f.id}
                type="button"
                onClick={() => toggleSearchFilter(f.id)}
                style={pillButtonStyle(active)}
                title={f.labelZh}
              >
                {f.label}
              </button>
            );
          })}

          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'wishlist' ? 'ALL' : 'wishlist'))
            }
            style={pillButtonStyle(statusFilter === 'wishlist')}
          >
            ★ 在願望清單 ({wishlistCount})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'inventory' ? 'ALL' : 'inventory'))
            }
            style={pillButtonStyle(statusFilter === 'inventory')}
          >
            📦 在庫存中 ({inventoryCount})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) =>
                prev === 'scheduled_trade' ? 'ALL' : 'scheduled_trade'
              )
            }
            style={pillButtonStyle(statusFilter === 'scheduled_trade')}
          >
            🤝 已排定交易 ({scheduledTradeCount})
          </button>

          <button
            type="button"
            onClick={() =>
              setStatusFilter((prev) => (prev === 'sold' ? 'ALL' : 'sold'))
            }
            style={pillButtonStyle(statusFilter === 'sold')}
          >
            💰 出售 ({soldCount})
          </button>
        </div>
      </div>

      {/* Sort By Dropdown */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '10px',
          marginBottom: '18px',
        }}
      >
        <span style={{ fontSize: '16px', fontWeight: 700 }}>Sort by:</span>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortOption)}
          style={{
            padding: '8px 14px',
            fontSize: '15px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            background: '#ffffff',
            minWidth: '280px',
            cursor: 'pointer',
          }}
        >
          <option value="dex_asc">Dex Number ↑ (寶可夢號碼 No.0001 → No.1025)</option>
          <option value="dex_desc">Dex Number ↓ (寶可夢號碼 No.1025 → No.0001)</option>
          <option value="account_asc">Account ↑ (依帳號分類排列 A → Z)</option>
          <option value="account_desc">Account ↓ (依帳號分類排列 Z → A)</option>
        </select>
      </div>

      {/* Pokemon Storage Grid Box */}
      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '12px',
          padding: '12px',
          background: '#fafafa',
          maxHeight: '640px',
          overflowY: 'auto',
          marginBottom: '22px',
        }}
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: '#64748b' }}>
            載入寶可夢倉庫資料中...
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 16px', color: '#64748b' }}>
            <div style={{ fontSize: '16px', fontWeight: 700, marginBottom: '6px' }}>
              目前尚無符合條件的寶可夢資料
            </div>
            <div style={{ fontSize: '13px', marginBottom: '12px' }}>
              {isAdmin
                ? '點擊上方「＋ 新增寶可夢」即可選擇寶可夢、設定標籤與上傳實際遊戲截圖！'
                : '請嘗試調整上方搜尋關鍵字或篩選條件。'}
            </div>
            {hasAnyActiveFilter && (
              <button
                type="button"
                onClick={clearAllFilters}
                style={{
                  padding: '6px 14px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                重置所有篩選
              </button>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(195px, 1fr))',
              gap: '12px',
            }}
          >
            {filteredAndSortedItems.map((item) => (
              <PokemonCard
                key={item.id}
                item={item}
                onSelect={isAdmin ? (it) => openEditForm(it) : undefined}
                onEdit={isAdmin ? (it) => openEditForm(it) : undefined}
                onDelete={isAdmin ? (id) => handleDeletePokemon(id) : undefined}
                onUpdateScreenshot={isAdmin ? handleQuickUpdateScreenshot : undefined}
                onPreviewScreenshot={(it) => setLightboxItem(it)}
                onReserve={!isAdmin ? (it) => openReserveModal(it) : undefined}
              />
            ))}
          </div>
        )}
      </div>

      {/* Bottom Sections Matching Image 1 & Image 2 (Select Tags, Select GBL Info, Ball) */}
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <div
          style={{
            fontSize: '17px',
            fontWeight: 700,
            marginBottom: '10px',
            color: '#111827',
          }}
        >
          Select Tags:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            maxWidth: '700px',
            margin: '0 auto',
          }}
        >
          {TAG_OPTIONS.map((tag) => {
            const active = activeTagFilters.includes(tag);
            return (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTagFilter(tag)}
                style={pillButtonStyle(active)}
              >
                {tag}
              </button>
            );
          })}
        </div>
      </div>

      {/* Select GBL Info */}
      <div style={{ textAlign: 'center', marginBottom: '22px' }}>
        <div
          style={{
            fontSize: '17px',
            fontWeight: 700,
            marginBottom: '10px',
            color: '#111827',
          }}
        >
          Select GBL Info:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '8px',
            maxWidth: '640px',
            margin: '0 auto',
          }}
        >
          {GBL_INFO_OPTIONS.map((gbl) => {
            const active = activeGblFilters.includes(gbl);
            return (
              <button
                key={gbl}
                type="button"
                onClick={() => toggleGblFilter(gbl)}
                style={pillButtonStyle(active)}
              >
                {gbl}
              </button>
            );
          })}
        </div>
      </div>

      {/* Ball Section */}
      <div style={{ textAlign: 'center', marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '20px',
            fontWeight: 700,
            marginBottom: '12px',
            color: '#111827',
          }}
        >
          Ball:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            gap: '10px',
          }}
        >
          {BALL_OPTIONS.map((b) => {
            const active = activeBallFilter === b.id;
            return (
              <button
                key={b.id}
                type="button"
                onClick={() => toggleBallFilter(b.id)}
                title={`${b.nameZh} (${b.nameEn})`}
                style={{
                  width: '54px',
                  height: '44px',
                  borderRadius: '999px',
                  border: active ? '2px solid #1e293b' : '1px solid #dcdfe6',
                  background: active ? '#cbd5e1' : '#e6e8ee',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: active ? '0 0 0 2px rgba(30,41,59,0.2)' : 'none',
                  transition: 'all 0.12s ease',
                }}
              >
                <BallIcon ball={b.id} size={28} />
              </button>
            );
          })}
        </div>
      </div>

      {/* Admin Login Modal */}
      {showLoginModal && (
        <div
          onClick={() => setShowLoginModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 60,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '380px',
              width: '100%',
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '14px',
              }}
            >
              <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>
                🔑 管理員登入
              </h3>
              <button
                type="button"
                onClick={() => setShowLoginModal(false)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  padding: '3px 8px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAdminLoginSubmit}>
              <div style={{ marginBottom: '12px' }}>
                <label
                  style={{
                    display: 'block',
                    fontSize: '13.5px',
                    fontWeight: 600,
                    color: '#334155',
                    marginBottom: '6px',
                  }}
                >
                  請輸入管理員密碼：
                </label>
                <input
                  type="password"
                  autoFocus
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  placeholder="輸入管理員密碼..."
                  style={{
                    width: '100%',
                    padding: '9px 12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '15px',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {loginError && (
                <div
                  style={{
                    color: '#b91c1c',
                    fontSize: '13px',
                    fontWeight: 600,
                    marginBottom: '10px',
                  }}
                >
                  ⚠️ {loginError}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => setShowLoginModal(false)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#fff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  disabled={loggingIn}
                  style={{
                    padding: '8px 18px',
                    borderRadius: '8px',
                    border: '1px solid #1d4ed8',
                    background: '#2563eb',
                    color: '#fff',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  {loggingIn ? '驗證中...' : '確認登入'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Pokemon Modal (Admin only) */}
      {isAdmin && showFormModal && (
        <div
          onClick={() => setShowFormModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onPaste={handleModalPaste}
            style={{
              background: '#ffffff',
              borderRadius: '14px',
              maxWidth: '820px',
              width: '100%',
              maxHeight: '92vh',
              overflowY: 'auto',
              padding: '22px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.25)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e2e8f0',
                paddingBottom: '12px',
                marginBottom: '16px',
              }}
            >
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: 0 }}>
                {editingId ? '編輯寶可夢欄位、分類與實際圖片' : '新增寶可夢至倉庫 (Select & Customize)'}
              </h2>
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                style={{
                  border: '1px solid #cbd5e1',
                  background: '#f8fafc',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕ 關閉
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1fr) 220px',
                  gap: '20px',
                  alignItems: 'start',
                }}
              >
                {/* Left Column: Menus & Options */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* 1. 選擇寶可夢 (1 ~ 1025) */}
                  <div
                    style={{
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <label
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        fontSize: '14px',
                        marginBottom: '6px',
                      }}
                    >
                      1. 選擇寶可夢（全圖鑑 No.0001 妙蛙種子 ～ No.1025 桃歹郎）：
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        type="text"
                        value={speciesSearch}
                        onChange={(e) => {
                          const val = e.target.value;
                          setSpeciesSearch(val);
                          const q = val.trim().toLowerCase();
                          if (q) {
                            const firstMatch = POKEMON_SPECIES_LIST.find(
                              (sp) =>
                                String(sp.dexNumber) === q ||
                                String(sp.dexNumber).padStart(4, '0') === q ||
                                sp.nameZh.toLowerCase().includes(q) ||
                                sp.nameEn.toLowerCase().includes(q)
                            );
                            if (firstMatch) {
                              handleSelectSpecies(firstMatch.dexNumber);
                            }
                          }
                        }}
                        placeholder="快速搜尋編號或名稱（例：0250、鳳王、妙蛙種子）..."
                        style={{
                          flex: '1 1 200px',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13.5px',
                        }}
                      />
                      <select
                        value={formDexNumber}
                        onChange={(e) => handleSelectSpecies(Number(e.target.value))}
                        style={{
                          flex: '1 1 240px',
                          padding: '7px 10px',
                          border: '1px solid #94a3b8',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          background: '#fff',
                        }}
                      >
                        {filteredSpeciesOptions.map((sp) => (
                          <option key={sp.dexNumber} value={sp.dexNumber}>
                            {formatDexNumber(sp.dexNumber)} {sp.nameZh} ({sp.nameEn})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* 2. 所屬帳號與分類狀態 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                      background: '#f8fafc',
                      padding: '12px',
                      borderRadius: '8px',
                      border: '1px solid #e2e8f0',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          marginBottom: '4px',
                        }}
                      >
                        2. 所屬帳號標籤 (Account)：
                      </label>
                      <select
                        value={formAccount}
                        onChange={(e) => setFormAccount(e.target.value)}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          background: '#fff',
                        }}
                      >
                        {accounts.map((acc) => (
                          <option key={acc} value={acc}>
                            👤 {acc}
                          </option>
                        ))}
                        <option value="__new__">＋ 輸入新帳號名稱...</option>
                      </select>
                      {formAccount === '__new__' && (
                        <input
                          type="text"
                          value={formCustomAccount}
                          onChange={(e) => setFormCustomAccount(e.target.value)}
                          placeholder="請輸入新帳號名稱..."
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '6px 10px',
                            border: '1px solid #94a3b8',
                            borderRadius: '6px',
                            fontSize: '13.5px',
                            boxSizing: 'border-box',
                            background: '#fff',
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          marginBottom: '4px',
                        }}
                      >
                        3. 狀態分類 (庫存 / 已排定交易 / 出售 / 願望)：
                      </label>
                      <select
                        value={formStatus}
                        onChange={(e) => {
                          const nextStatus = e.target.value as InventoryStatus;
                          setFormStatus(nextStatus);
                          if (nextStatus === 'sold' && !formSoldPrice.trim()) {
                            setFormSoldPrice('50NTD');
                          }
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '14px',
                          fontWeight: 600,
                          background: '#fff',
                        }}
                      >
                        <option value="inventory">📦 In My Inventory (在庫存中)</option>
                        <option value="scheduled_trade">🤝 已排定交易（可寫備註是誰）</option>
                        <option value="sold">💰 出售（可寫價格，預設 50NTD）</option>
                        <option value="wishlist">★ On My Wishlist (在願望清單)</option>
                      </select>

                      {formStatus === 'scheduled_trade' && (
                        <div style={{ marginTop: '6px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#c2410c',
                              marginBottom: '2px',
                            }}
                          >
                            🤝 排定交易對象（備註是誰）：
                          </label>
                          <input
                            type="text"
                            value={formTradePartner}
                            onChange={(e) => setFormTradePartner(e.target.value)}
                            placeholder="例如：給 小明 / FB: 王大明 (週六交換)"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid #fdba74',
                              borderRadius: '6px',
                              fontSize: '13.5px',
                              boxSizing: 'border-box',
                              background: '#fff7ed',
                            }}
                          />
                        </div>
                      )}

                      {formStatus === 'sold' && (
                        <div style={{ marginTop: '6px' }}>
                          <label
                            style={{
                              display: 'block',
                              fontSize: '12px',
                              fontWeight: 700,
                              color: '#047857',
                              marginBottom: '2px',
                            }}
                          >
                            💰 出售價格（預設 50NTD）：
                          </label>
                          <input
                            type="text"
                            value={formSoldPrice}
                            onChange={(e) => setFormSoldPrice(e.target.value)}
                            placeholder="50NTD"
                            style={{
                              width: '100%',
                              padding: '6px 10px',
                              border: '1px solid #6ee7b7',
                              borderRadius: '6px',
                              fontSize: '13.5px',
                              boxSizing: 'border-box',
                              background: '#ecfdf5',
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 4. 裝扮與背卡選單 */}
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          marginBottom: '4px',
                        }}
                      >
                        4. 特殊裝扮選單 (Costume)：
                      </label>
                      <select
                        value={formCostumePreset}
                        onChange={(e) => {
                          const val = e.target.value;
                          setFormCostumePreset(val);
                          setFormIsCostume(val !== '');
                        }}
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13.5px',
                        }}
                      >
                        {COSTUME_PRESETS.map((c) => (
                          <option key={c.label} value={c.value}>
                            {c.label}
                          </option>
                        ))}
                        <option value="__custom__">自訂裝扮名稱...</option>
                      </select>
                      {formCostumePreset === '__custom__' && (
                        <input
                          type="text"
                          value={formCostumeCustom}
                          onChange={(e) => setFormCostumeCustom(e.target.value)}
                          placeholder="例如：Party Hat、Safari Hat..."
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '6px 10px',
                            border: '1px solid #94a3b8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>

                    <div>
                      <label
                        style={{
                          display: 'block',
                          fontWeight: 700,
                          fontSize: '13.5px',
                          marginBottom: '4px',
                        }}
                      >
                        5. 背卡樣式選單 (Background / Location)：
                      </label>
                      <select
                        value={formBgPreset}
                        onChange={(e) =>
                          handleBackgroundPresetChange(e.target.value as BackgroundStyle)
                        }
                        style={{
                          width: '100%',
                          padding: '7px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '13.5px',
                        }}
                      >
                        {BACKGROUND_PRESETS.map((b) => (
                          <option key={b.style} value={b.style}>
                            {b.label}
                          </option>
                        ))}
                      </select>
                      {formBgPreset !== 'none' && (
                        <input
                          type="text"
                          value={formBgCustomName}
                          onChange={(e) => setFormBgCustomName(e.target.value)}
                          placeholder="背卡顯示文字（如 Mystic Background）"
                          style={{
                            width: '100%',
                            marginTop: '6px',
                            padding: '6px 10px',
                            border: '1px solid #94a3b8',
                            borderRadius: '6px',
                            fontSize: '13px',
                            boxSizing: 'border-box',
                          }}
                        />
                      )}
                    </div>
                  </div>

                  {/* 5. Search Filters 屬性勾選 */}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        marginBottom: '6px',
                      }}
                    >
                      6. 特殊分類標記 (Search Filter Flags)：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      <button
                        type="button"
                        onClick={() => setFormIsShiny((v) => !v)}
                        style={pillButtonStyle(formIsShiny)}
                      >
                        ✨ Shiny (異色)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsCostume((v) => !v)}
                        style={pillButtonStyle(formIsCostume)}
                      >
                        🎩 Costume (裝扮)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsLocationCard((v) => !v)}
                        style={pillButtonStyle(formIsLocationCard)}
                      >
                        🌐 Location Card (地區背卡)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsGigantamax((v) => !v)}
                        style={pillButtonStyle(formIsGigantamax)}
                      >
                        👑 Gigantamax (超極巨化)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsLegendary((v) => !v)}
                        style={pillButtonStyle(formIsLegendary)}
                      >
                        Legendary (傳說)
                      </button>
                      <button
                        type="button"
                        onClick={() => setFormIsUltraBeast((v) => !v)}
                        style={pillButtonStyle(formIsUltraBeast)}
                      >
                        Ultra Beast (究極異獸)
                      </button>
                    </div>
                  </div>

                  {/* 6. Select Tags */}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        marginBottom: '6px',
                      }}
                    >
                      7. Select Tags (可多選)：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {TAG_OPTIONS.map((tag) => {
                        const active = formTags.includes(tag);
                        return (
                          <button
                            key={tag}
                            type="button"
                            onClick={() =>
                              setFormTags((prev) =>
                                prev.includes(tag)
                                  ? prev.filter((t) => t !== tag)
                                  : [...prev, tag]
                              )
                            }
                            style={pillButtonStyle(active)}
                          >
                            {tag}
                          </button>
                        );
                      })}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                      <input
                        type="text"
                        value={formCustomTag}
                        onChange={(e) => setFormCustomTag(e.target.value)}
                        placeholder="新增自訂 Tag（例如：100%IV、Lucky、暗影）..."
                        style={{
                          padding: '5px 10px',
                          border: '1px solid #cbd5e1',
                          borderRadius: '6px',
                          fontSize: '12.5px',
                          flex: 1,
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const t = formCustomTag.trim();
                          if (t && !formTags.includes(t)) {
                            setFormTags((prev) => [...prev, t]);
                          }
                          setFormCustomTag('');
                        }}
                        style={{
                          padding: '5px 12px',
                          borderRadius: '6px',
                          border: '1px solid #64748b',
                          background: '#f1f5f9',
                          fontSize: '12.5px',
                          fontWeight: 600,
                          cursor: 'pointer',
                        }}
                      >
                        ＋加入 Tag
                      </button>
                    </div>
                  </div>

                  {/* 7. Select GBL Info */}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        marginBottom: '6px',
                      }}
                    >
                      8. Select GBL Info (對戰聯盟標籤，可多選)：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {GBL_INFO_OPTIONS.map((gbl) => {
                        const active = formGblTags.includes(gbl);
                        return (
                          <button
                            key={gbl}
                            type="button"
                            onClick={() =>
                              setFormGblTags((prev) =>
                                prev.includes(gbl)
                                  ? prev.filter((g) => g !== gbl)
                                  : [...prev, gbl]
                              )
                            }
                            style={pillButtonStyle(active)}
                          >
                            {gbl}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8. Ball Selector */}
                  <div>
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: '13.5px',
                        marginBottom: '6px',
                      }}
                    >
                      9. Ball (選擇球種 / 孵化方式)：
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                      {BALL_OPTIONS.map((b) => {
                        const active = formBall === b.id;
                        return (
                          <button
                            key={b.id}
                            type="button"
                            onClick={() =>
                              setFormBall((prev) => (prev === b.id ? '' : b.id))
                            }
                            title={`${b.nameZh} (${b.nameEn})`}
                            style={{
                              width: '50px',
                              height: '40px',
                              borderRadius: '999px',
                              border: active
                                ? '2px solid #1e293b'
                                : '1px solid #dcdfe6',
                              background: active ? '#cbd5e1' : '#e6e8ee',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              cursor: 'pointer',
                            }}
                          >
                            <BallIcon ball={b.id} size={25} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 10. 實際遊戲截圖插入區 */}
                  <div
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleModalDrop}
                    style={{
                      border: '2px dashed #94a3b8',
                      borderRadius: '8px',
                      padding: '12px',
                      background: '#f8fafc',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '4px' }}>
                      10. 插入寶可夢實際圖片（手機遊戲截圖，如 CP / IV / 捕捉地點）：
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px' }}>
                      點擊下方按鈕選擇圖片、將截圖拖曳至此，或直接按 Ctrl+V / Cmd+V 貼上截圖
                    </div>
                    <input
                      ref={modalFileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleModalScreenshotSelect}
                      style={{ display: 'none' }}
                    />
                    <div style={{ display: 'flex', justifyContent: 'center', gap: '8px' }}>
                      <button
                        type="button"
                        onClick={() => modalFileInputRef.current?.click()}
                        style={{
                          padding: '6px 14px',
                          borderRadius: '6px',
                          border: '1px solid #334155',
                          background: '#e2e8f0',
                          fontWeight: 700,
                          fontSize: '13px',
                          cursor: 'pointer',
                        }}
                      >
                        📷 選擇實際遊戲截圖上傳
                      </button>
                      {formScreenshotUrl && (
                        <button
                          type="button"
                          onClick={() => setFormScreenshotUrl('')}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '6px',
                            border: '1px solid #fca5a5',
                            background: '#fef2f2',
                            color: '#b91c1c',
                            fontWeight: 600,
                            fontSize: '13px',
                            cursor: 'pointer',
                          }}
                        >
                          移除截圖
                        </button>
                      )}
                    </div>
                  </div>

                  {/* 11. 備註 */}
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontWeight: 700,
                        fontSize: '13.5px',
                        marginBottom: '4px',
                      }}
                    >
                      11. 備註說明（選填）：
                    </label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="例如：至尊鳳王100、2022/2/27 台灣東區捕捉..."
                      style={{
                        width: '100%',
                        padding: '7px 10px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '6px',
                        fontSize: '13.5px',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                {/* Right Column: Live Card Preview */}
                <div
                  style={{
                    position: 'sticky',
                    top: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '13px',
                      fontWeight: 700,
                      textAlign: 'center',
                      color: '#475569',
                    }}
                  >
                    即時欄位預覽 (Card Preview)
                  </div>
                  <PokemonCard
                    item={previewItem}
                    onUpdateScreenshot={(_it, url) => setFormScreenshotUrl(url)}
                  />
                </div>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '10px',
                  marginTop: '18px',
                  paddingTop: '14px',
                  borderTop: '1px solid #e2e8f0',
                }}
              >
                <button
                  type="button"
                  onClick={() => setShowFormModal(false)}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    background: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 600,
                  }}
                >
                  取消
                </button>
                <button
                  type="submit"
                  style={{
                    padding: '8px 20px',
                    borderRadius: '8px',
                    border: '1px solid #1d4ed8',
                    background: '#2563eb',
                    color: '#ffffff',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '14px',
                  }}
                >
                  {editingId ? '💾 儲存修改' : '＋ 確認加入倉庫'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Client-Only Reservation Modal (僅客戶端未登入買家可見，主控端看不到) */}
      {!isAdmin && reservingItem && reservingItem.status === 'sold' && (() => {
        const cleanThreads = reserveThreadsCode.trim().replace(/^@+/, '');
        const isThreadsLengthValid =
          cleanThreads.length >= 5 && cleanThreads.length <= 7;
        const canConfirmReserve = isThreadsLengthValid && reserveAgreed && !reserving;

        return (
          <div
            onClick={() => setReservingItem(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(15, 23, 42, 0.6)',
              zIndex: 60,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '16px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                background: '#ffffff',
                borderRadius: '14px',
                maxWidth: '460px',
                width: '100%',
                maxHeight: '92vh',
                overflowY: 'auto',
                padding: '22px',
                boxShadow: '0 20px 45px rgba(0,0,0,0.3)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #e2e8f0',
                  paddingBottom: '12px',
                  marginBottom: '16px',
                }}
              >
                <h3 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: '#0f172a' }}>
                  🙋 預約寶可夢確認
                </h3>
                <button
                  type="button"
                  onClick={() => setReservingItem(null)}
                  style={{
                    border: '1px solid #cbd5e1',
                    background: '#f8fafc',
                    borderRadius: '6px',
                    padding: '3px 8px',
                    cursor: 'pointer',
                    fontWeight: 700,
                  }}
                >
                  ✕
                </button>
              </div>

              {/* Target Pokemon Summary */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  background: '#ecfdf5',
                  border: '1px solid #6ee7b7',
                  borderRadius: '10px',
                  padding: '10px 14px',
                  marginBottom: '16px',
                }}
              >
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 800, color: '#065f46' }}>
                    {formatDexNumber(reservingItem.dexNumber)} {reservingItem.nameZh}{' '}
                    {reservingItem.isShiny ? '✨' : ''}
                  </div>
                  <div style={{ fontSize: '12px', color: '#047857', marginTop: '2px' }}>
                    所屬帳號：👤 {reservingItem.account}
                  </div>
                </div>
                <div
                  style={{
                    fontSize: '14px',
                    fontWeight: 800,
                    color: '#047857',
                    background: '#ffffff',
                    padding: '4px 10px',
                    borderRadius: '8px',
                    border: '1px solid #34d399',
                  }}
                >
                  💰 出售：{formatDeclarationPrice(reservingItem.soldPrice)}
                </div>
              </div>

              <form onSubmit={handleReserveSubmit}>
                {/* Step 1: Threads 5-7 chars */}
                <div style={{ marginBottom: '16px' }}>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '14px',
                      fontWeight: 700,
                      color: '#1e293b',
                      marginBottom: '6px',
                    }}
                  >
                    1. 請填入您的 Threads 帳號「前 5 ～ 7 碼」：
                  </label>
                  <input
                    type="text"
                    autoFocus
                    value={reserveThreadsCode}
                    onChange={(e) => {
                      setReserveThreadsCode(e.target.value);
                      setReserveError('');
                    }}
                    placeholder="請輸入 5 ～ 7 個字元（例：blues_9）"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border:
                        cleanThreads.length === 0
                          ? '1.5px solid #cbd5e1'
                          : isThreadsLengthValid
                          ? '1.5px solid #10b981'
                          : '1.5px solid #ef4444',
                      borderRadius: '8px',
                      fontSize: '15px',
                      boxSizing: 'border-box',
                      outline: 'none',
                    }}
                  />
                  <div
                    style={{
                      marginTop: '6px',
                      fontSize: '12.5px',
                      fontWeight: 600,
                      color:
                        cleanThreads.length === 0
                          ? '#64748b'
                          : isThreadsLengthValid
                          ? '#059669'
                          : '#dc2626',
                    }}
                  >
                    {cleanThreads.length === 0
                      ? '⚠️ 字元數必須在 5 ～ 7 碼範圍內才開放預約'
                      : isThreadsLengthValid
                      ? `✅ 字元數符合規定（目前輸入：${cleanThreads.length} 碼）`
                      : `❌ 字元數不符（目前輸入：${cleanThreads.length} 碼，必須為 5 ～ 7 碼）`}
                  </div>
                </div>

                {/* Step 2: Reservation Declaration (預約聲明) */}
                <div
                  style={{
                    background: '#fffbeb',
                    border: '1.5px solid #fcd34d',
                    borderRadius: '10px',
                    padding: '14px',
                    marginBottom: '14px',
                  }}
                >
                  <div
                    style={{
                      fontSize: '14.5px',
                      fontWeight: 800,
                      color: '#92400e',
                      marginBottom: '8px',
                    }}
                  >
                    📋 預約聲明（最後確認）：
                  </div>
                  <ol
                    style={{
                      margin: 0,
                      paddingLeft: '20px',
                      fontSize: '13.5px',
                      lineHeight: '1.75',
                      color: '#78350f',
                      fontWeight: 600,
                    }}
                  >
                    <li>確定你可以郵局轉帳，不收8591</li>
                    <li>
                      確認金額{' '}
                      <span
                        style={{
                          color: '#b91c1c',
                          fontWeight: 800,
                          textDecoration: 'underline',
                        }}
                      >
                        {formatDeclarationPrice(reservingItem.soldPrice)}
                      </span>
                    </li>
                    <li>幫推一下拜託</li>
                    <li>網站還在測試階段，請不要公開連結以防宵小</li>
                  </ol>

                  <label
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '12px',
                      paddingTop: '10px',
                      borderTop: '1px dashed #fbbf24',
                      cursor: 'pointer',
                      fontSize: '13.5px',
                      fontWeight: 700,
                      color: '#1e293b',
                      userSelect: 'none',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={reserveAgreed}
                      onChange={(e) => {
                        setReserveAgreed(e.target.checked);
                        setReserveError('');
                      }}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    我已閱讀並同意上述 4 點預約聲明
                  </label>
                </div>

                {reserveError && (
                  <div
                    style={{
                      color: '#b91c1c',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      padding: '8px 12px',
                      fontSize: '13px',
                      fontWeight: 700,
                      marginBottom: '12px',
                    }}
                  >
                    ⚠️ {reserveError}
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                  <button
                    type="button"
                    onClick={() => setReservingItem(null)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '8px',
                      border: '1px solid #cbd5e1',
                      background: '#ffffff',
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={!canConfirmReserve}
                    style={{
                      padding: '8px 18px',
                      borderRadius: '8px',
                      border: canConfirmReserve
                        ? '1px solid #059669'
                        : '1px solid #cbd5e1',
                      background: canConfirmReserve ? '#10b981' : '#e2e8f0',
                      color: canConfirmReserve ? '#ffffff' : '#94a3b8',
                      cursor: canConfirmReserve ? 'pointer' : 'not-allowed',
                      fontWeight: 700,
                      fontSize: '14px',
                    }}
                  >
                    {reserving ? '預約送出中...' : '✅ 確認預約'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      })()}

      {/* Full-Screen Screenshot Lightbox Modal */}
      {lightboxItem && lightboxItem.screenshotUrl && (
        <div
          onClick={() => setLightboxItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.82)',
            zIndex: 60,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#0f172a',
              borderRadius: '14px',
              padding: '14px',
              maxWidth: '460px',
              width: '100%',
              maxHeight: '92vh',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '10px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div
              style={{
                width: '100%',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                color: '#ffffff',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                {formatDexNumber(lightboxItem.dexNumber)} {lightboxItem.nameZh}（👤{' '}
                {lightboxItem.account}）
              </div>
              <button
                type="button"
                onClick={() => setLightboxItem(null)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  padding: '4px 10px',
                  cursor: 'pointer',
                  fontWeight: 700,
                }}
              >
                ✕ 關閉
              </button>
            </div>
            <img
              src={lightboxItem.screenshotUrl}
              alt={`${lightboxItem.nameZh} 實際遊戲截圖`}
              style={{
                maxWidth: '100%',
                maxHeight: '78vh',
                objectFit: 'contain',
                borderRadius: '8px',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
