begin;
-- El crédito S/ 5 pasa a ser el premio más frecuente (65%). El 35% restante se reparte en
-- proporción a los pesos anteriores. Suma 100. Los premios ya otorgados no cambian.
update reward_pool set weight=case prize
  when 'credit5' then 65 when 'bracelet' then 10 when 'necklace' then 10
  when 'ring' then 6 when 'perfume' then 6 when 'gymbox' then 3 end
 where tier='sorpresa';
do $$ begin
 if (select sum(weight) from reward_pool where tier='sorpresa')<>100 then raise exception 'reward_pool sorpresa must sum 100'; end if;
end $$;
commit;
